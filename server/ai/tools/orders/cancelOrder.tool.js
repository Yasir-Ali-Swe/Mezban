import prisma from "../../../config/prisma.js";

/**
 * Cancels a pending customer order.
 * Enforces businessId and customerId isolation and order status checks.
 */
export const cancelOrderTool = {
  name: "cancelOrder",
  description: "Cancels an order if it is still pending confirmation.",
  execute: async ({ businessId, customerId, orderNumber }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    if (!orderNumber || !orderNumber.trim()) {
      return { success: false, error: "MISSING_ORDER_NUMBER", message: "Order number is required to cancel an order." };
    }

    const where = {
      businessId,
      orderNumber: orderNumber.trim(),
      ...(customerId ? { customerId } : {}),
    };

    const order = await prisma.order.findFirst({
      where,
    });

    if (!order) {
      return {
        success: false,
        error: "ORDER_NOT_FOUND",
        message: `Order #${orderNumber} was not found or does not belong to your account.`,
      };
    }

    if (order.status === "CANCELLED") {
      return {
        success: true,
        orderNumber: order.orderNumber,
        status: "CANCELLED",
        message: `Order #${order.orderNumber} is already cancelled.`,
      };
    }

    if (order.status !== "PENDING") {
      return {
        success: false,
        error: "CANNOT_CANCEL",
        message: `Order #${order.orderNumber} cannot be cancelled because its current status is '${order.status}' (only PENDING orders can be cancelled).`,
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
