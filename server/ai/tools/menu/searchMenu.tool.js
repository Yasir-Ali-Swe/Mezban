import prisma from "../../../config/prisma.js";

export const searchMenuTool = {
  name: "searchMenu",
  description: "Searches available food menu items by name query or category.",
  execute: async ({ businessId, query, categoryName }) => {
    const where = { businessId, status: "AVAILABLE" };

    if (query) {
      where.OR = [
        { name: { contains: query, mode: "insensitive" } },
        { description: { contains: query, mode: "insensitive" } },
      ];
    }

    if (categoryName) {
      where.category = { name: { contains: categoryName, mode: "insensitive" } };
    }

    const items = await prisma.menuItem.findMany({
      where,
      include: { category: true },
      take: 10,
    });

    if (items.length === 0) {
      return { message: "No menu items found matching your request.", items: [] };
    }

    return {
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category?.name || "General",
        price: Number(i.sellingPrice),
        description: i.description || "",
        status: i.status,
      })),
    };
  },
};
