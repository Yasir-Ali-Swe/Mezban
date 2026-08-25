import prisma from "../../../config/prisma.js";

/**
 * Searches active and available food menu items.
 * Enforces business isolation, category.status = ACTIVE, and menuItem.status = AVAILABLE.
 */
export const searchMenuTool = {
  name: "searchMenu",
  description: "Searches available food menu items by name query or category.",
  execute: async ({ businessId, query, categoryName, limit = 10 }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    const where = {
      businessId,
      status: "AVAILABLE",
      category: {
        status: "ACTIVE",
      },
    };

    if (query && query.trim()) {
      const cleanQuery = query.trim();
      where.OR = [
        { name: { contains: cleanQuery, mode: "insensitive" } },
        { description: { contains: cleanQuery, mode: "insensitive" } },
      ];
    }

    if (categoryName && categoryName.trim()) {
      where.category = {
        status: "ACTIVE",
        name: { contains: categoryName.trim(), mode: "insensitive" },
      };
    }

    const takeLimit = Math.min(Math.max(1, parseInt(limit) || 10), 30);

    const items = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      take: takeLimit,
      orderBy: { name: "asc" },
    });

    if (items.length === 0) {
      return {
        success: true,
        message: query
          ? `No available menu items found matching '${query}'.`
          : "No available menu items found.",
        items: [],
      };
    }

    return {
      success: true,
      count: items.length,
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category?.name || "General",
        price: Number(i.sellingPrice),
        description: i.description || "",
        status: i.status,
        isAvailable: true,
      })),
    };
  },
};
