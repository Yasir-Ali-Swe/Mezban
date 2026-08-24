import prisma from "../../../config/prisma.js";

export const cancelOrderTool = {
  name: "cancelOrder",
  description: "Cancels an order if it is still pending confirmation.",
  execute: async ({ businessId, customerId, orderNumber }) => {
    const order = await prisma.order.findFirst({
      where: {
        businessId,
        orderNumber,
        ...(customerId ? { customerId } : {}),
      },
    });

    if (!order) return { error: "Order not found" };

    if (order.status !== "PENDING") {
      return {
        error: `Order #${order.orderNumber} cannot be cancelled because its status is '${order.status}'.`,
      };
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });

    return {
      success: true,
      orderNumber: updated.orderNumber,
      status: updated.status,
      message: `Order #${updated.orderNumber} has been successfully cancelled.`,
    };
  },
};
