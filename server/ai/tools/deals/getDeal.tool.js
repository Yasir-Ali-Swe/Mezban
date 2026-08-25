import prisma from "../../../config/prisma.js";

/**
 * Retrieves details for a specific promotional deal.
 */
export const getDealTool = {
  name: "getDeal",
  description: "Fetches details and items included in a specific promotional deal.",
  execute: async ({ businessId, dealName, dealId }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    if (!dealId && (!dealName || !dealName.trim())) {
      return { success: false, error: "MISSING_ARGUMENT", message: "Deal name or ID is required." };
    }

    let where = { businessId };
    if (dealId) {
      where.id = dealId;
    } else if (dealName) {
      where.name = { contains: dealName.trim(), mode: "insensitive" };
    }

    const deal = await prisma.deal.findFirst({
      where,
      include: { items: true },
    });

    if (!deal) {
      return {
        success: false,
        error: "DEAL_NOT_FOUND",
        message: `Deal '${dealName || dealId}' was not found.`,
      };
    }

    const isAvailable = deal.status === "ACTIVE";

    return {
      success: true,
      deal: {
        id: deal.id,
        name: deal.name,
        description: deal.description,
        price: Number(deal.sellingPrice),
        status: deal.status,
        isAvailable,
        items: deal.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
        })),
      },
      message: isAvailable
        ? `Deal '${deal.name}' is available for Rs. ${Number(deal.sellingPrice)}.`
        : `Deal '${deal.name}' is currently inactive.`,
    };
  },
};
