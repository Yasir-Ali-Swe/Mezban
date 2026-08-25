import prisma from "../../../config/prisma.js";

/**
 * Retrieves customer profile and contact information scoped by businessId and customerId.
 */
export const getCustomerTool = {
  name: "getCustomer",
  description: "Retrieves customer profile and contact information.",
  execute: async ({ customerId, businessId }) => {
    if (!businessId || !customerId) {
      return { success: false, error: "MISSING_IDENTIFIER", message: "Customer and business IDs are required." };
    }

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
      include: {
        _count: {
          select: {
            orders: true,
            reservations: true,
          },
        },
      },
    });

    if (!customer) {
      return { success: false, error: "CUSTOMER_NOT_FOUND", message: "Customer record was not found." };
    }

    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
        telegramChatId: customer.telegramChatId,
        totalOrders: customer._count.orders,
        totalReservations: customer._count.reservations,
      },
    };
  },
};
