import prisma from "../../../config/prisma.js";

export const getMenuItemTool = {
  name: "getMenuItem",
  description: "Gets detailed pricing, category, and availability information for a specific menu item.",
  execute: async ({ businessId, itemName, itemId }) => {
    let where = { businessId };
    if (itemId) {
      where.id = itemId;
    } else if (itemName) {
      where.name = { contains: itemName, mode: "insensitive" };
    }

    const item = await prisma.menuItem.findFirst({
      where,
      include: { category: true },
    });

    if (!item) return { error: "Menu item not found" };

    return {
      id: item.id,
      name: item.name,
      category: item.category?.name || "General",
      price: Number(item.sellingPrice),
      description: item.description || "",
      isAvailable: item.status === "AVAILABLE",
    };
  },
};
