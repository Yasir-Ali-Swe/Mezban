import prisma from "../../../config/prisma.js";

export const getCustomerOrdersTool = {
  name: "getCustomerOrders",
  description: "Retrieves recent order history for the current customer.",
  execute: async ({ businessId, customerId }) => {
    if (!customerId) return { error: "Customer ID is required" };

    const orders = await prisma.order.findMany({
      where: { businessId, customerId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { items: true },
    });

    if (orders.length === 0) {
      return { message: "No previous orders found for this customer.", orders: [] };
    }

    return {
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((i) => `${i.quantity}x ${i.name}`),
      })),
    };
  },
};
