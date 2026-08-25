import prisma from "../../../config/prisma.js";

/**
 * Checks explicit availability for a specific dish.
 */
export const checkMenuAvailabilityTool = {
  name: "checkMenuAvailability",
  description: "Checks if a specific dish or menu item is currently available in stock.",
  execute: async ({ businessId, itemName }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    if (!itemName || !itemName.trim()) {
      return { success: false, error: "MISSING_ITEM_NAME", message: "Dish name is required to check availability." };
    }

    const item = await prisma.menuItem.findFirst({
      where: {
        businessId,
        name: { contains: itemName.trim(), mode: "insensitive" },
      },
      include: { category: true },
    });

    if (!item) {
      return {
        success: false,
        error: "ITEM_NOT_FOUND",
        isAvailable: false,
        message: `Dish '${itemName}' is not on our menu.`,
      };
    }

    const isAvailable = item.status === "AVAILABLE" && item.category?.status === "ACTIVE";

    return {
      success: true,
      itemId: item.id,
      name: item.name,
      category: item.category?.name || "General",
      price: Number(item.sellingPrice),
      isAvailable,
      status: item.status,
      message: isAvailable
        ? `'${item.name}' is available for Rs. ${Number(item.sellingPrice)}.`
        : `'${item.name}' is currently out of stock / unavailable.`,
    };
  },
};
