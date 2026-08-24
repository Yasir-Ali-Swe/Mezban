import prisma from "../../../config/prisma.js";

export const checkMenuAvailabilityTool = {
  name: "checkMenuAvailability",
  description: "Checks if a specific dish or menu item is currently available in stock.",
  execute: async ({ businessId, itemName }) => {
    const item = await prisma.menuItem.findFirst({
      where: {
        businessId,
        name: { contains: itemName, mode: "insensitive" },
      },
    });

    if (!item) {
      return { isAvailable: false, message: `Dish '${itemName}' is not on our menu.` };
    }

    const available = item.status === "AVAILABLE";
    return {
      itemId: item.id,
      name: item.name,
      price: Number(item.sellingPrice),
      isAvailable: available,
      message: available
        ? `'${item.name}' is available for Rs. ${Number(item.sellingPrice)}.`
        : `'${item.name}' is currently out of stock.`,
    };
  },
};
