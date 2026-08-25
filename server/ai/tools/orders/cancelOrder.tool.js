import prisma from "../../../config/prisma.js";

/**
 * Cancels a pending customer order.
 * If the order is already CONFIRMED, PREPARING, or OUT_FOR_DELIVERY,
 * it cannot be cancelled automatically and the conversation is escalated to staff.
 */
export const cancelOrderTool = {
  name: "cancelOrder",
  description: "Cancels an order if it is still pending confirmation. Escalates if order is already in progress.",
  execute: async ({ businessId, customerId, conversationId, orderNumber }) => {
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

    if (order.status === "COMPLETED") {
      return {
        success: false,
        error: "ORDER_COMPLETED",
        message: `Order #${order.orderNumber} has already been completed/delivered and cannot be cancelled.`,
      };
    }

    if (order.status !== "PENDING") {
      // Escalate conversation to human staff
      if (conversationId) {
        try {
          await prisma.conversation.update({
            where: { id: conversationId },
            data: { status: "ESCALATED", intent: "SUPPORT" },
          });
        } catch (e) {
          // ignore error
        }
      }

      const friendlyStatusMap = {
        CONFIRMED: "Confirmed",
        PREPARING: "Preparing in kitchen",
        OUT_FOR_DELIVERY: "Out for delivery",
      };
      const friendlyStatus = friendlyStatusMap[order.status] || order.status;

      return {
        success: false,
        error: "CANNOT_CANCEL_IN_PROGRESS",
        escalated: true,
        message: `Order #${order.orderNumber} is currently '${friendlyStatus}' and cannot be cancelled automatically. I have escalated this request to our staff to assist you directly.`,
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
