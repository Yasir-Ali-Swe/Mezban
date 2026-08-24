import prisma from "../../config/prisma.js";

/**
 * Retrieves customer history (previous orders & reservations)
 */
export async function getLongTermMemory(customerId, businessId) {
  if (!customerId || !businessId) return null;

  const [customer, recentOrders, recentReservations] = await Promise.all([
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
  ]);

  if (!customer) return null;

  return {
    customerName: customer.name,
    phone: customer.phone,
    email: customer.email,
    telegramChatId: customer.telegramChatId,
    recentOrders: recentOrders.map((o) => ({
      orderNumber: o.orderNumber,
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt,
      items: o.items.map((i) => `${i.quantity}x ${i.name}`),
    })),
    recentReservations: recentReservations.map((r) => ({
      reservationNumber: r.reservationNumber,
      reservationAt: r.reservationAt,
      guestCount: r.guestCount,
      status: r.status,
    })),
  };
}
