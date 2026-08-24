import prisma from "../../../config/prisma.js";

export const getReservationTool = {
  name: "getReservation",
  description: "Fetches details and status of a table reservation by reservation number.",
  execute: async ({ businessId, reservationNumber, customerId }) => {
    let where = { businessId };
    if (reservationNumber) {
      where.reservationNumber = reservationNumber;
    } else if (customerId) {
      where.customerId = customerId;
    } else {
      return { error: "Reservation number or customer ID required" };
    }

    const reservation = await prisma.reservation.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });

    if (!reservation) return { error: "Reservation not found" };

    return {
      reservationId: reservation.id,
      reservationNumber: reservation.reservationNumber,
      customerName: reservation.customer?.name,
      guestCount: reservation.guestCount,
      reservationAt: reservation.reservationAt.toISOString(),
      status: reservation.status,
    };
  },
};
