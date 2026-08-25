import prisma from "../../../config/prisma.js";

/**
 * Retrieves recent order history for the current customer.
 * Enforces businessId and customerId isolation with sensible pagination.
 */
export const getCustomerOrdersTool = {
  name: "getCustomerOrders",
  description: "Retrieves recent order history for the current customer.",
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
      },
    });

    if (orders.length === 0) {
      return {
        success: true,
        message: "You do not have any past orders yet.",
        orders: [],
      };
    }

    return {
      success: true,
      count: orders.length,
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        status: o.status,
        orderType: o.orderType,
        total: Number(o.total),
        createdAt: o.createdAt.toISOString(),
        items: o.items.map((i) => `${i.quantity}x ${i.name}`),
      })),
    };
  },
};
