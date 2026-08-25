import prisma from "../../../config/prisma.js";

/**
 * Searches active promotional deals and combo offers.
 * Enforces business isolation and status = ACTIVE.
 */
export const searchDealsTool = {
  name: "searchDeals",
  description: "Searches active promotional deals and combo offers available at the restaurant.",
  execute: async ({ businessId }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    const deals = await prisma.deal.findMany({
      where: {
        businessId,
        status: "ACTIVE",
      },
      include: {
        items: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (deals.length === 0) {
      return {
        success: true,
        message: "No active promotional deals available right now.",
        deals: [],
      };
    }

    return {
      success: true,
      count: deals.length,
      deals: deals.map((d) => ({
        id: d.id,
        name: d.name,
        description: d.description,
        price: Number(d.sellingPrice),
        status: d.status,
        isAvailable: true,
        items: d.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
        })),
      })),
    };
  },
};
