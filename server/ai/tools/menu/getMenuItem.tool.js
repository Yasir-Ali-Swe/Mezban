import prisma from "../../../config/prisma.js";

/**
 * Retrieves details for a specific menu item.
 * Explicitly reports availability and price.
 */
export const getMenuItemTool = {
  name: "getMenuItem",
  description: "Gets detailed pricing, category, and availability information for a specific menu item.",
  execute: async ({ businessId, itemName, itemId }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    if (!itemId && (!itemName || !itemName.trim())) {
      return { success: false, error: "MISSING_ARGUMENT", message: "Item name or ID is required." };
    }

    let where = { businessId };
    if (itemId) {
      where.id = itemId;
    } else if (itemName) {
      where.name = { contains: itemName.trim(), mode: "insensitive" };
    }

    const item = await prisma.menuItem.findFirst({
      where,
      include: { category: true },
    });

    if (!item) {
      return {
        success: false,
        error: "ITEM_NOT_FOUND",
        message: `Menu item '${itemName || itemId}' was not found on our menu.`,
      };
    }

    const isAvailable = item.status === "AVAILABLE" && item.category?.status === "ACTIVE";

    return {
      success: true,
      item: {
        id: item.id,
        name: item.name,
        category: item.category?.name || "General",
        price: Number(item.sellingPrice),
        description: item.description || "",
        status: item.status,
        isAvailable,
      },
      message: isAvailable
        ? `'${item.name}' is available for Rs. ${Number(item.sellingPrice)}.`
        : `'${item.name}' is currently unavailable.`,
    };
  },
};
