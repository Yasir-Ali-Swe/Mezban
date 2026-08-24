import prisma from "../../../config/prisma.js";

export const getOrderTool = {
  name: "getOrder",
  description: "Retrieves status, total price, and item breakdown for an order by order number or ID.",
  execute: async ({ businessId, orderNumber, orderId }) => {
    let where = { businessId };
    if (orderId) {
      where.id = orderId;
    } else if (orderNumber) {
      where.orderNumber = orderNumber;
    } else {
      return { error: "Order number or ID is required" };
    }

    const order = await prisma.order.findFirst({
      where,
      include: { items: true, customer: true },
    });

    if (!order) return { error: "Order not found" };

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name,
      status: order.status,
      orderType: order.orderType,
      total: Number(order.total),
      createdAt: order.createdAt.toISOString(),
      items: order.items.map((i) => ({ name: i.name, quantity: i.quantity, price: Number(i.subtotal) })),
    };
  },
};
