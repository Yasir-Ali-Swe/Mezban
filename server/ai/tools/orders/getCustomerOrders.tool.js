import prisma from "../../../config/prisma.js";

/**
 * Retrieves recent order history and previous delivery information for the current customer.
 * Enforces businessId and customerId isolation.
 */
export const getCustomerOrdersTool = {
  name: "getCustomerOrders",
  description:
    "Retrieves recent order history, latest previous delivery address, contact phone, and payment method for the current customer. Call this to check previous orders when a customer wants to place a new order or track past orders.",
  execute: async ({ businessId, customerId, limit = 5 }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    if (!customerId) {
      return { success: false, error: "MISSING_CUSTOMER_ID", message: "Customer context is required to view order history." };
    }

    const takeLimit = Math.min(Math.max(1, parseInt(limit) || 5), 15);

    const orders = await prisma.order.findMany({
      where: {
        businessId,
        customerId,
      },
      orderBy: { createdAt: "desc" },
      take: takeLimit,
      include: {
        items: true,
        customer: true,
      },
    });

    if (orders.length === 0) {
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, businessId },
      });

      return {
        success: true,
        count: 0,
        hasPreviousOrders: false,
        previousDeliveryAddress: null,
        previousPaymentMethod: null,
        previousPhone: customer?.phone || null,
        customerName: customer?.name || null,
        message: "You do not have any past orders yet.",
        orders: [],
      };
    }

    const latestValidDeliveryOrder = orders.find(
      (o) => o.orderType === "DELIVERY" && (o.shippingStreet || o.shippingCity)
    );

    const latestOrder = orders[0];
    const latestShippingParts = [
      latestOrder.shippingStreet,
      latestOrder.shippingCity,
      latestOrder.shippingState,
      latestOrder.shippingZipCode,
      latestOrder.shippingCountry,
    ].filter(Boolean);
    const latestShippingAddress = latestShippingParts.length > 0 ? latestShippingParts.join(", ") : null;

    const previousDeliveryParts = latestValidDeliveryOrder
      ? [
        latestValidDeliveryOrder.shippingStreet,
        latestValidDeliveryOrder.shippingCity,
        latestValidDeliveryOrder.shippingState,
        latestValidDeliveryOrder.shippingZipCode,
        latestValidDeliveryOrder.shippingCountry,
      ].filter(Boolean)
      : latestShippingParts;
    const previousDeliveryAddress = previousDeliveryParts.length > 0 ? previousDeliveryParts.join(", ") : null;

    return {
      success: true,
      count: orders.length,
      hasPreviousOrders: true,
      previousDeliveryAddress: previousDeliveryAddress || null,
      previousPaymentMethod: latestOrder.paymentMethod || latestValidDeliveryOrder?.paymentMethod || null,
      previousPhone: latestOrder.customerPhone || latestOrder.customer?.phone || null,
      customerName: latestOrder.customer?.name || null,
      latestOrder: {
        orderNumber: latestOrder.orderNumber,
        status: latestOrder.status,
        orderType: latestOrder.orderType,
        paymentMethod: latestOrder.paymentMethod || "Cash on Delivery",
        customerPhone: latestOrder.customerPhone || latestOrder.customer?.phone || null,
        shippingAddress: latestShippingAddress,
        total: Number(latestOrder.total),
        createdAt: latestOrder.createdAt.toISOString(),
        items: latestOrder.items.map((i) => `${i.quantity}x ${i.name}`),
      },
      orders: orders.map((o) => {
        const parts = [o.shippingStreet, o.shippingCity, o.shippingState, o.shippingZipCode, o.shippingCountry].filter(
          Boolean
        );
        return {
          orderNumber: o.orderNumber,
          status: o.status,
          orderType: o.orderType,
          paymentMethod: o.paymentMethod || null,
          customerPhone: o.customerPhone || o.customer?.phone || null,
          shippingAddress: parts.length > 0 ? parts.join(", ") : null,
          total: Number(o.total),
          createdAt: o.createdAt.toISOString(),
          items: o.items.map((i) => `${i.quantity}x ${i.name}`),
        };
      }),
    };
  },
};
