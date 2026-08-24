import prisma from "../../../config/prisma.js";

export const createReservationTool = {
  name: "createReservation",
  description: "Creates a new table reservation for a customer.",
  execute: async ({ businessId, customerId, reservationDate, reservationTime, guestCount = 2, notes }) => {
    if (!customerId) return { error: "Customer context is required to create a reservation." };

    const reservationNumber = `RES-${Date.now().toString().slice(-6)}`;
    let reservationAt = new Date();

    if (reservationDate) {
      const dateStr = reservationTime ? `${reservationDate} ${reservationTime}` : reservationDate;
      const parsedDate = new Date(dateStr);
      if (!isNaN(parsedDate.getTime())) {
        reservationAt = parsedDate;
      }
    }

    const guests = Math.max(1, parseInt(guestCount) || 2);

    const reservation = await prisma.reservation.create({
      data: {
        businessId,
        customerId,
        reservationNumber,
        reservationAt,
        guestCount: guests,
        status: "CONFIRMED",
        notes: notes || null,
      },
      include: { customer: true },
    });

    return {
      success: true,
      reservationNumber: reservation.reservationNumber,
      reservationId: reservation.id,
      guestCount: reservation.guestCount,
      reservationAt: reservation.reservationAt.toISOString(),
      status: reservation.status,
      customerName: reservation.customer?.name,
    };
  },
};
