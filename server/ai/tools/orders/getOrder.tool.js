import prisma from "../../../config/prisma.js";

/**
 * Retrieves details, status, and itemized breakdown of an order.
 * Enforces businessId and customerId isolation.
 */
export const getOrderTool = {
  name: "getOrder",
  description: "Retrieves status, total price, and item breakdown for an order by order number or ID.",
  execute: async ({ businessId, customerId, orderNumber, orderId }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    if (!orderId && (!orderNumber || !orderNumber.trim())) {
      return { success: false, error: "MISSING_ORDER_IDENTIFIER", message: "Order number or ID is required." };
    }

    const where = {
      businessId,
      ...(orderId ? { id: orderId } : { orderNumber: orderNumber.trim() }),
      ...(customerId ? { customerId } : {}),
    };

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: true,
        customer: true,
      },
    });

    if (!order) {
      return {
        success: false,
        error: "ORDER_NOT_FOUND",
        message: `Order #${orderNumber || orderId} was not found or does not belong to your account.`,
      };
    }

    const friendlyStatus = {
      PENDING: "Pending Confirmation",
      CONFIRMED: "Confirmed",
      PREPARING: "Preparing",
      OUT_FOR_DELIVERY: "Out for Delivery",
      COMPLETED: "Completed",
      CANCELLED: "Cancelled",
    }[order.status] || order.status;

    return {
      success: true,
      order: {
        orderId: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        orderType: order.orderType,
        customerName: order.customer?.name || "Customer",
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        tax: Number(order.tax),
        total: Number(order.total),
        notes: order.notes || "",
        shippingAddress: order.shippingStreet || order.shippingCity || "",
        createdAt: order.createdAt.toISOString(),
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          subtotal: Number(i.subtotal),
          isDeal: Boolean(i.dealId),
        })),
      },
      message: `Order #${order.orderNumber} is currently '${friendlyStatus}'. Total: Rs. ${Number(order.total)}.`,
    };
  },
};
