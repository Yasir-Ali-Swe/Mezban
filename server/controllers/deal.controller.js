import prisma from "../config/prisma.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

export const getDealStats = async (req, res) => {
  try {
    const where = { businessId: req.businessId };
    const [totalDeals, activeDeals, inactiveDeals, totalOrders] = await Promise.all([
      prisma.deal.count({ where }),
      prisma.deal.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.deal.count({ where: { ...where, status: "INACTIVE" } }),
      prisma.orderItem.count({ where: { deal: { businessId: req.businessId } } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalDeals,
        activeDeals,
        inactiveDeals,
        totalOrders,
      },
    });
  } catch (error) {
    console.error("getDealStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch deal statistics",
      error: error.message,
    });
  }
};

export const getDeals = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      sortBy = "name",
      order = "asc",
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      businessId: req.businessId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status !== "all") {
      const isActive = status === "active" || status === "ACTIVE";
      where.status = isActive ? "ACTIVE" : "INACTIVE";
    }

    let orderBy = {};
    const sortOrder = order === "desc" ? "desc" : "asc";

    if (sortBy === "price") {
      orderBy = { sellingPrice: sortOrder };
    } else if (sortBy === "orders") {
      orderBy = { orderItems: { _count: sortOrder } };
    } else {
      orderBy = { name: sortOrder };
    }

    const [deals, total] = await Promise.all([
      prisma.deal.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          items: {
            include: { menuItem: true },
          },
          _count: {
            select: { orderItems: true },
          },
        },
      }),
      prisma.deal.count({ where }),
    ]);

    const formatted = deals.map((deal) => ({
      _id: deal.id,
      id: deal.id,
      name: deal.name,
      description: deal.description,
      costPrice: Number(deal.costPrice),
      sellingPrice: Number(deal.sellingPrice),
      price: Number(deal.sellingPrice),
      imageUrl: deal.imageUrl,
      status: deal.status === "ACTIVE" ? "active" : "inactive",
      isActive: deal.status === "ACTIVE",
      itemsCount: deal.items.length,
      items: deal.items.length,
      orders: deal._count.orderItems,
      dealItems: deal.items.map((di) => ({
        _id: di.menuItemId,
        id: di.id,
        menuItemId: di.menuItemId,
        name: di.name,
        unitPrice: Number(di.unitPrice),
        quantity: di.quantity,
        subtotal: Number(di.unitPrice) * di.quantity,
      })),
      createdAt: deal.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("getDeals error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch deals",
      error: error.message,
    });
  }
};

export const getDealById = async (req, res) => {
  try {
    const { id } = req.params;

    const deal = await prisma.deal.findFirst({
      where: { id, businessId: req.businessId },
      include: {
        items: {
          include: { menuItem: true },
        },
      },
    });

    if (!deal) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: deal.id,
        id: deal.id,
        name: deal.name,
        description: deal.description,
        costPrice: Number(deal.costPrice),
        sellingPrice: Number(deal.sellingPrice),
        price: Number(deal.sellingPrice),
        imageUrl: deal.imageUrl,
        status: deal.status === "ACTIVE" ? "active" : "inactive",
        isActive: deal.status === "ACTIVE",
        items: deal.items.map((di) => ({
          _id: di.menuItemId,
          id: di.id,
          menuItemId: di.menuItemId,
          name: di.name,
          unitPrice: Number(di.unitPrice),
          quantity: di.quantity,
          subtotal: Number(di.unitPrice) * di.quantity,
        })),
        createdAt: deal.createdAt,
      },
    });
  } catch (error) {
    console.error("getDealById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch deal",
      error: error.message,
    });
  }
};

export const createDeal = async (req, res) => {
  try {
    const {
      name,
      description,
      costPrice,
      sellingPrice,
      status,
      imageUrl,
      items = [],
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Deal name is required",
      });
    }

    let rawItems = [];
    if (typeof items === "string") {
      try {
        rawItems = JSON.parse(items);
      } catch (e) {
        rawItems = [];
      }
    } else if (Array.isArray(items)) {
      rawItems = items;
    }

    if (!Array.isArray(rawItems) || rawItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one menu item is required for a deal",
      });
    }

    // Verify all menu items belong to the current business (Strict Cross-Tenant Protection)
    const menuItemIds = rawItems.map((item) => item._id || item.menuItemId);
    const validMenuItems = await prisma.menuItem.findMany({
      where: {
        id: { in: menuItemIds },
        businessId: req.businessId,
      },
    });

    if (validMenuItems.length !== menuItemIds.length) {
      return res.status(403).json({
        success: false,
        message: "One or more selected menu items do not belong to your business",
      });
    }

    const menuMap = new Map(validMenuItems.map((mi) => [mi.id, mi]));

    const computedCost = rawItems.reduce((sum, item) => {
      const id = item._id || item.menuItemId;
      const mi = menuMap.get(id);
      const unit = item.unitPrice !== undefined ? parseFloat(item.unitPrice) : Number(mi.sellingPrice);
      return sum + unit * (parseInt(item.quantity) || 1);
    }, 0);

    let finalImageUrl = imageUrl || null;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, "deals");
        finalImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload deal image to Cloudinary",
        });
      }
    }

    const dealStatus =
      status === "inactive" || status === "INACTIVE" ? "INACTIVE" : "ACTIVE";

    const deal = await prisma.deal.create({
      data: {
        businessId: req.businessId,
        name: name.trim(),
        description: (description || "").slice(0, 350),
        costPrice: parseFloat(costPrice) || computedCost,
        sellingPrice: parseFloat(sellingPrice) || 0,
        imageUrl: finalImageUrl,
        status: dealStatus,
        items: {
          create: rawItems.map((item) => {
            const id = item._id || item.menuItemId;
            const mi = menuMap.get(id);
            const unitPrice =
              item.unitPrice !== undefined ? parseFloat(item.unitPrice) : Number(mi.sellingPrice);
            return {
              menuItemId: id,
              name: item.name || mi.name,
              unitPrice,
              quantity: parseInt(item.quantity) || 1,
            };
          }),
        },
      },
      include: {
        items: true,
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: deal.id,
        id: deal.id,
        name: deal.name,
        description: deal.description,
        costPrice: Number(deal.costPrice),
        sellingPrice: Number(deal.sellingPrice),
        price: Number(deal.sellingPrice),
        imageUrl: deal.imageUrl,
        status: deal.status === "ACTIVE" ? "active" : "inactive",
        isActive: deal.status === "ACTIVE",
        items: deal.items.length,
        createdAt: deal.createdAt,
      },
      message: "Deal created successfully",
    });
  } catch (error) {
    console.error("createDeal error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create deal",
      error: error.message,
    });
  }
};

export const updateDeal = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      costPrice,
      sellingPrice,
      status,
      imageUrl,
      items,
    } = req.body;

    const existing = await prisma.deal.findFirst({
      where: { id, businessId: req.businessId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    let finalImageUrl = existing.imageUrl;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, "deals");
        finalImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload image to Cloudinary",
        });
      }
    } else if (imageUrl !== undefined) {
      finalImageUrl = imageUrl;
    }

    let dealStatus = existing.status;
    if (status !== undefined) {
      dealStatus =
        status === "inactive" || status === "INACTIVE" ? "INACTIVE" : "ACTIVE";
    }

    let updateData = {
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description.slice(0, 350) }),
      ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) }),
      ...(sellingPrice !== undefined && { sellingPrice: parseFloat(sellingPrice) }),
      imageUrl: finalImageUrl,
      status: dealStatus,
    };

    if (items) {
      let rawItems = [];
      if (typeof items === "string") {
        try {
          rawItems = JSON.parse(items);
        } catch (e) {
          rawItems = [];
        }
      } else if (Array.isArray(items)) {
        rawItems = items;
      }

      if (Array.isArray(rawItems) && rawItems.length > 0) {
        const menuItemIds = rawItems.map((item) => item._id || item.menuItemId);
        const validMenuItems = await prisma.menuItem.findMany({
          where: {
            id: { in: menuItemIds },
            businessId: req.businessId,
          },
        });

        if (validMenuItems.length !== menuItemIds.length) {
          return res.status(403).json({
            success: false,
            message: "One or more selected menu items do not belong to your business",
          });
        }

        const menuMap = new Map(validMenuItems.map((mi) => [mi.id, mi]));

        // Delete existing items and recreate
        await prisma.dealItem.deleteMany({ where: { dealId: id } });

        updateData.items = {
          create: rawItems.map((item) => {
            const mId = item._id || item.menuItemId;
            const mi = menuMap.get(mId);
            const unitPrice =
              item.unitPrice !== undefined ? parseFloat(item.unitPrice) : Number(mi.sellingPrice);
            return {
              menuItemId: mId,
              name: item.name || mi.name,
              unitPrice,
              quantity: parseInt(item.quantity) || 1,
            };
          }),
        };
      }
    }

    const updated = await prisma.deal.update({
      where: { id },
      data: updateData,
      include: { items: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: updated.id,
        id: updated.id,
        name: updated.name,
        description: updated.description,
        costPrice: Number(updated.costPrice),
        sellingPrice: Number(updated.sellingPrice),
        price: Number(updated.sellingPrice),
        imageUrl: updated.imageUrl,
        status: updated.status === "ACTIVE" ? "active" : "inactive",
        isActive: updated.status === "ACTIVE",
        items: updated.items.length,
        createdAt: updated.createdAt,
      },
      message: "Deal updated successfully",
    });
  } catch (error) {
    console.error("updateDeal error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update deal",
      error: error.message,
    });
  }
};

export const deleteDeal = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.deal.findFirst({
      where: { id, businessId: req.businessId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Deal not found",
      });
    }

    await prisma.deal.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Deal deleted successfully",
    });
  } catch (error) {
    console.error("deleteDeal error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete deal",
      error: error.message,
    });
  }
};
