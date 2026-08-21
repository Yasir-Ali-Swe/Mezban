import prisma from "../config/prisma.js";
import { uploadToCloudinary } from "../config/cloudinary.js";

export const getMenuStats = async (req, res) => {
  try {
    const where = { businessId: req.businessId };
    const [totalItems, availableItems, unavailableItems, categoriesCount] = await Promise.all([
      prisma.menuItem.count({ where }),
      prisma.menuItem.count({ where: { ...where, status: "AVAILABLE" } }),
      prisma.menuItem.count({ where: { ...where, status: "UNAVAILABLE" } }),
      prisma.category.count({ where }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalItems,
        availableItems,
        unavailableItems,
        categoriesCount,
      },
    });
  } catch (error) {
    console.error("getMenuStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu statistics",
      error: error.message,
    });
  }
};

export const getMenuItems = async (req, res) => {
  try {
    const {
      search = "",
      category = "all",
      availability = "all",
      minPrice,
      maxPrice,
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
        { category: { name: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (category !== "all") {
      where.OR = [
        { categoryId: category },
        { category: { name: category } },
      ];
    }

    if (availability !== "all") {
      const isAvailable = availability === "available" || availability === "AVAILABLE";
      where.status = isAvailable ? "AVAILABLE" : "UNAVAILABLE";
    }

    if (minPrice || maxPrice) {
      where.sellingPrice = {};
      if (minPrice) where.sellingPrice.gte = parseFloat(minPrice);
      if (maxPrice) where.sellingPrice.lte = parseFloat(maxPrice);
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

    const [items, total] = await Promise.all([
      prisma.menuItem.findMany({
        where,
        skip,
        take: limitNum,
        orderBy,
        include: {
          category: true,
          _count: {
            select: { orderItems: true },
          },
        },
      }),
      prisma.menuItem.count({ where }),
    ]);

    const formatted = items.map((item) => ({
      _id: item.id,
      id: item.id,
      name: item.name,
      description: item.description,
      category: item.category?.name || "Uncategorized",
      categoryId: item.categoryId,
      costPrice: Number(item.costPrice),
      sellingPrice: Number(item.sellingPrice),
      price: Number(item.sellingPrice),
      imageUrl: item.imageUrl,
      status: item.status === "AVAILABLE" ? "available" : "unavailable",
      isAvailable: item.status === "AVAILABLE",
      orders: item._count.orderItems,
      createdAt: item.createdAt,
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
    console.error("getMenuItems error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu items",
      error: error.message,
    });
  }
};

export const getMenuItemById = async (req, res) => {
  try {
    const { id } = req.params;

    const item = await prisma.menuItem.findFirst({
      where: { id, businessId: req.businessId },
      include: { category: true },
    });

    if (!item) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: item.id,
        id: item.id,
        name: item.name,
        description: item.description,
        category: item.category?.name || "Uncategorized",
        categoryId: item.categoryId,
        costPrice: Number(item.costPrice),
        sellingPrice: Number(item.sellingPrice),
        price: Number(item.sellingPrice),
        imageUrl: item.imageUrl,
        status: item.status === "AVAILABLE" ? "available" : "unavailable",
        isAvailable: item.status === "AVAILABLE",
        createdAt: item.createdAt,
      },
    });
  } catch (error) {
    console.error("getMenuItemById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch menu item",
      error: error.message,
    });
  }
};

export const createMenuItem = async (req, res) => {
  try {
    const {
      name,
      description,
      category,
      categoryId,
      costPrice,
      sellingPrice,
      status,
      imageUrl,
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Menu item name is required",
      });
    }

    let targetCategoryId = categoryId;

    if (!targetCategoryId && category) {
      let foundCategory = await prisma.category.findFirst({
        where: {
          businessId: req.businessId,
          OR: [
            { id: category },
            { name: { equals: category, mode: "insensitive" } },
          ],
        },
      });

      if (!foundCategory) {
        const slug = category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
        foundCategory = await prisma.category.create({
          data: {
            businessId: req.businessId,
            name: category,
            slug,
            status: "ACTIVE",
          },
        });
      }

      targetCategoryId = foundCategory.id;
    }

    if (!targetCategoryId) {
      return res.status(400).json({
        success: false,
        message: "Valid category is required",
      });
    }

    let finalImageUrl = imageUrl || null;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, "menu_items");
        finalImageUrl = uploadResult.secure_url;
      } catch (uploadError) {
        console.error("Cloudinary upload error:", uploadError);
        return res.status(500).json({
          success: false,
          message: "Failed to upload menu item image to Cloudinary",
        });
      }
    }

    const itemStatus =
      status === "unavailable" || status === "UNAVAILABLE"
        ? "UNAVAILABLE"
        : "AVAILABLE";

    const newItem = await prisma.menuItem.create({
      data: {
        businessId: req.businessId,
        categoryId: targetCategoryId,
        name: name.trim(),
        description: description || null,
        costPrice: parseFloat(costPrice) || 0,
        sellingPrice: parseFloat(sellingPrice) || 0,
        imageUrl: finalImageUrl,
        status: itemStatus,
      },
      include: { category: true },
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: newItem.id,
        id: newItem.id,
        name: newItem.name,
        description: newItem.description,
        category: newItem.category?.name || "",
        categoryId: newItem.categoryId,
        costPrice: Number(newItem.costPrice),
        sellingPrice: Number(newItem.sellingPrice),
        price: Number(newItem.sellingPrice),
        imageUrl: newItem.imageUrl,
        status: newItem.status === "AVAILABLE" ? "available" : "unavailable",
        isAvailable: newItem.status === "AVAILABLE",
        createdAt: newItem.createdAt,
      },
      message: "Menu item created successfully",
    });
  } catch (error) {
    console.error("createMenuItem error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create menu item",
      error: error.message,
    });
  }
};

export const updateMenuItem = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      category,
      categoryId,
      costPrice,
      sellingPrice,
      status,
      imageUrl,
    } = req.body;

    const existing = await prisma.menuItem.findFirst({
      where: { id, businessId: req.businessId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    let targetCategoryId = existing.categoryId;

    if (categoryId || category) {
      let foundCategory = await prisma.category.findFirst({
        where: {
          businessId: req.businessId,
          OR: [
            { id: categoryId || category },
            { name: { equals: category, mode: "insensitive" } },
          ],
        },
      });

      if (foundCategory) {
        targetCategoryId = foundCategory.id;
      }
    }

    let finalImageUrl = existing.imageUrl;
    if (req.file) {
      try {
        const uploadResult = await uploadToCloudinary(req.file.buffer, "menu_items");
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

    let itemStatus = existing.status;
    if (status !== undefined) {
      itemStatus =
        status === "unavailable" || status === "UNAVAILABLE"
          ? "UNAVAILABLE"
          : "AVAILABLE";
    }

    const updated = await prisma.menuItem.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(description !== undefined && { description }),
        categoryId: targetCategoryId,
        ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) }),
        ...(sellingPrice !== undefined && { sellingPrice: parseFloat(sellingPrice) }),
        imageUrl: finalImageUrl,
        status: itemStatus,
      },
      include: { category: true },
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: updated.id,
        id: updated.id,
        name: updated.name,
        description: updated.description,
        category: updated.category?.name || "",
        categoryId: updated.categoryId,
        costPrice: Number(updated.costPrice),
        sellingPrice: Number(updated.sellingPrice),
        price: Number(updated.sellingPrice),
        imageUrl: updated.imageUrl,
        status: updated.status === "AVAILABLE" ? "available" : "unavailable",
        isAvailable: updated.status === "AVAILABLE",
        createdAt: updated.createdAt,
      },
      message: "Menu item updated successfully",
    });
  } catch (error) {
    console.error("updateMenuItem error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update menu item",
      error: error.message,
    });
  }
};

export const deleteMenuItem = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.menuItem.findFirst({
      where: { id, businessId: req.businessId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Menu item not found",
      });
    }

    try {
      await prisma.menuItem.delete({
        where: { id },
      });
    } catch (e) {
      // If foreign key constraint prevents deletion, set status to UNAVAILABLE
      await prisma.menuItem.update({
        where: { id },
        data: { status: "UNAVAILABLE" },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Menu item deleted or marked unavailable successfully",
    });
  } catch (error) {
    console.error("deleteMenuItem error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete menu item",
      error: error.message,
    });
  }
};
