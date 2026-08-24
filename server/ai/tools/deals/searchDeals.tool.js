import prisma from "../../../config/prisma.js";

export const searchDealsTool = {
  name: "searchDeals",
  description: "Searches active promotional deals and combo offers available at the restaurant.",
  execute: async ({ businessId }) => {
    const deals = await prisma.deal.findMany({
      where: { businessId, status: "ACTIVE" },
      include: { items: true },
    });

    if (deals.length === 0) {
      return { message: "No active promotional deals available right now." };
    }

    return deals.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      price: Number(d.sellingPrice),
      items: d.items.map((i) => `${i.quantity}x ${i.name}`),
    }));
  },
};
