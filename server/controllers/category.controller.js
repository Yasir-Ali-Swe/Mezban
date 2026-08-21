import prisma from "../config/prisma.js";

const generateSlug = (name) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const getUserDisplayName = (user) => {
  if (!user) return null;
  const fullName = [user.firstName, user.lastName].filter(Boolean).join(" ");
  if (fullName.trim()) return fullName.trim();
  if (user.username) return user.username;
  if (user.email) return user.email.split("@")[0];
  return "User";
};

export const getCategoryStats = async (req, res) => {
  try {
    const where = { businessId: req.businessId };
    const [totalCategories, activeCategories, inactiveCategories] = await Promise.all([
      prisma.category.count({ where }),
      prisma.category.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.category.count({ where: { ...where, status: "INACTIVE" } }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalCategories,
        activeCategories,
        inactiveCategories,
      },
    });
  } catch (error) {
    console.error("getCategoryStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch category statistics",
      error: error.message,
    });
  }
};

export const getCategories = async (req, res) => {
  try {
    const { search = "", status = "all", page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      businessId: req.businessId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { slug: { contains: search, mode: "insensitive" } },
      ];
    }

    if (status !== "all") {
      const statusUpper = status.toUpperCase();
      if (statusUpper === "ACTIVE" || statusUpper === "INACTIVE") {
        where.status = statusUpper;
      }
    }

    const [categories, total] = await Promise.all([
      prisma.category.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { menuItems: true },
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              imageUrl: true,
            },
          },
        },
      }),
      prisma.category.count({ where }),
    ]);

    const formatted = categories.map((cat) => ({
      _id: cat.id,
      id: cat.id,
      name: cat.name,
      categorySlug: cat.slug,
      slug: cat.slug,
      status: cat.status,
      isActive: cat.status === "ACTIVE",
      productsCount: cat._count.menuItems,
      createdBy: cat.createdBy
        ? {
          id: cat.createdBy.id,
          name: getUserDisplayName(cat.createdBy).toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase()),
          username: cat.createdBy.username || null,
          imageUrl: cat.createdBy.imageUrl || null,
        }
        : null,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
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
    console.error("getCategories error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
      error: error.message,
    });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const baseSlug = generateSlug(name.trim());
    let slug = baseSlug;
    let count = 1;

    while (
      await prisma.category.findUnique({
        where: {
          businessId_slug: {
            businessId: req.businessId,
            slug,
          },
        },
      })
    ) {
      slug = `${baseSlug}-${count++}`;
    }

    const category = await prisma.category.create({
      data: {
        businessId: req.businessId,
        createdById: req.userId || null,
        name: name.trim(),
        slug,
        status: "ACTIVE",
      },
      include: {
        _count: {
          select: { menuItems: true },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    return res.status(201).json({
      success: true,
      data: {
        _id: category.id,
        id: category.id,
        name: category.name,
        categorySlug: category.slug,
        slug: category.slug,
        status: category.status,
        isActive: category.status === "ACTIVE",
        productsCount: category._count.menuItems,
        createdBy: category.createdBy
          ? {
            id: category.createdBy.id,
            name: getUserDisplayName(category.createdBy),
            username: category.createdBy.username || null,
            imageUrl: category.createdBy.imageUrl || null,
          }
          : null,
        createdAt: category.createdAt,
      },
      message: "Category created successfully",
    });
  } catch (error) {
    console.error("createCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create category",
      error: error.message,
    });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, status, isActive } = req.body;

    const existing = await prisma.category.findFirst({
      where: { id, businessId: req.businessId },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    let nextStatus = existing.status;
    if (status) {
      nextStatus = status.toUpperCase() === "ACTIVE" ? "ACTIVE" : "INACTIVE";
    } else if (typeof isActive === "boolean") {
      nextStatus = isActive ? "ACTIVE" : "INACTIVE";
    }

    let nextSlug = existing.slug;
    if (name && name.trim() !== existing.name) {
      const baseSlug = generateSlug(name.trim());
      nextSlug = baseSlug;
      let count = 1;
      while (
        await prisma.category.findFirst({
          where: {
            businessId: req.businessId,
            slug: nextSlug,
            NOT: { id },
          },
        })
      ) {
        nextSlug = `${baseSlug}-${count++}`;
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        slug: nextSlug,
        status: nextStatus,
      },
      include: {
        _count: {
          select: { menuItems: true },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            imageUrl: true,
          },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        _id: updated.id,
        id: updated.id,
        name: updated.name,
        categorySlug: updated.slug,
        slug: updated.slug,
        status: updated.status,
        isActive: updated.status === "ACTIVE",
        productsCount: updated._count.menuItems,
        createdBy: updated.createdBy
          ? {
            id: updated.createdBy.id,
            name: getUserDisplayName(updated.createdBy),
            username: updated.createdBy.username || null,
            imageUrl: updated.createdBy.imageUrl || null,
          }
          : null,
        createdAt: updated.createdAt,
      },
      message: "Category updated successfully",
    });
  } catch (error) {
    console.error("updateCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update category",
      error: error.message,
    });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const existing = await prisma.category.findFirst({
      where: { id, businessId: req.businessId },
      include: {
        _count: {
          select: { menuItems: true },
        },
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    if (existing._count.menuItems > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${existing.name}". ${existing._count.menuItems} item(s) are associated with it.`,
      });
    }

    await prisma.category.delete({
      where: { id },
    });

    return res.status(200).json({
      success: true,
      message: "Category deleted successfully",
    });
  } catch (error) {
    console.error("deleteCategory error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete category",
      error: error.message,
    });
  }
};
