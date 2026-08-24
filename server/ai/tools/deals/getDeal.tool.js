import prisma from "../../../config/prisma.js";

export const getDealTool = {
  name: "getDeal",
  description: "Fetches details and items included in a specific promotional deal.",
  execute: async ({ businessId, dealName, dealId }) => {
    let where = { businessId };
    if (dealId) {
      where.id = dealId;
    } else if (dealName) {
      where.name = { contains: dealName, mode: "insensitive" };
    }

    const deal = await prisma.deal.findFirst({
      where,
      include: { items: true },
    });

    if (!deal) return { error: "Deal not found" };

    return {
      id: deal.id,
      name: deal.name,
      description: deal.description,
      price: Number(deal.sellingPrice),
      items: deal.items.map((i) => ({ name: i.name, quantity: i.quantity })),
      status: deal.status,
    };
  },
};
