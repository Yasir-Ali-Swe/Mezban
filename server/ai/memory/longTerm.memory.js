import prisma from "../../config/prisma.js";

/**
 * Retrieves customer history (previous orders, reservations, past conversations count)
 */
export async function getLongTermMemory(customerId, businessId, currentConversationId = null) {
  if (!customerId || !businessId) return null;

  const [customer, recentOrders, recentReservations, pastConversationsCount] = await Promise.all([
    prisma.customer.findFirst({
      where: { id: customerId, businessId },
    }),
    prisma.order.findMany({
      where: { customerId, businessId },
      orderBy: { createdAt: "desc" },
      take: 3,
      include: { items: true },
    }),
    prisma.reservation.findMany({
      where: { customerId, businessId },
      orderBy: { createdAt: "desc" },
      take: 3,
    }),
    prisma.conversation.count({
      where: {
        customerId,
        businessId,
        ...(currentConversationId ? { id: { not: currentConversationId } } : {}),
      },
    }),
  ]);

  if (!customer) return null;

  const isReturningCustomer =
    recentOrders.length > 0 ||
    recentReservations.length > 0 ||
    pastConversationsCount > 0;

  return {
    customerName: customer.name?.trim() || "",
    phone: customer.phone,
    email: customer.email,
    telegramChatId: customer.telegramChatId,
    isReturningCustomer,
    pastConversationsCount,
    recentOrders: recentOrders.map((o) => {
      const parts = [o.shippingStreet, o.shippingCity, o.shippingState, o.shippingZipCode, o.shippingCountry].filter(
        Boolean
      );
      return {
        orderNumber: o.orderNumber,
        total: Number(o.total),
        status: o.status,
        orderType: o.orderType,
        paymentMethod: o.paymentMethod || null,
        shippingAddress: parts.length > 0 ? parts.join(", ") : null,
        customerPhone: o.customerPhone || null,
        createdAt: o.createdAt,
        items: o.items.map((i) => `${i.quantity}x ${i.name}`),
      };
    }),
    recentReservations: recentReservations.map((r) => ({
      reservationNumber: r.reservationNumber,
      reservationAt: r.reservationAt,
      guestCount: r.guestCount,
      status: r.status,
    })),
  };
}
