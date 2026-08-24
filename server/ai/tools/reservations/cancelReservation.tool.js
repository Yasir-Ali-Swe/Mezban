import prisma from "../../../config/prisma.js";

export const cancelReservationTool = {
  name: "cancelReservation",
  description: "Cancels an existing table reservation.",
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
    });

    if (!reservation) return { error: "Reservation not found" };

    if (reservation.status === "CANCELLED") {
      return { message: `Reservation #${reservation.reservationNumber} is already cancelled.` };
    }

    const updated = await prisma.reservation.update({
      where: { id: reservation.id },
      data: { status: "CANCELLED" },
    });

    return {
      success: true,
      reservationNumber: updated.reservationNumber,
      status: updated.status,
      message: `Reservation #${updated.reservationNumber} has been cancelled successfully.`,
    };
  },
};
