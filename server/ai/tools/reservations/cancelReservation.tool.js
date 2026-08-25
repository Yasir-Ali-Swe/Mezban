import prisma from "../../../config/prisma.js";

/**
 * Cancels an existing table reservation.
 * Enforces businessId and customerId isolation.
 */
export const cancelReservationTool = {
  name: "cancelReservation",
  description: "Cancels an existing table reservation.",
  execute: async ({ businessId, customerId, reservationNumber }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    if (!reservationNumber && !customerId) {
      return { success: false, error: "MISSING_IDENTIFIER", message: "Reservation number is required to cancel a reservation." };
    }

    const where = {
      businessId,
      ...(reservationNumber ? { reservationNumber: reservationNumber.trim() } : {}),
      ...(customerId ? { customerId } : {}),
    };

    const reservation = await prisma.reservation.findFirst({
      where,
      orderBy: { createdAt: "desc" },
    });

    if (!reservation) {
      return {
        success: false,
        error: "RESERVATION_NOT_FOUND",
        message: `Reservation #${reservationNumber || ""} was not found or does not belong to your account.`,
      };
    }

    if (reservation.status === "CANCELLED") {
      return {
        success: true,
        reservationNumber: reservation.reservationNumber,
        status: "CANCELLED",
        message: `Reservation #${reservation.reservationNumber} is already cancelled.`,
      };
    }

    if (reservation.status === "COMPLETED") {
      return {
        success: false,
        error: "CANNOT_CANCEL",
        message: `Reservation #${reservation.reservationNumber} is marked as COMPLETED and cannot be cancelled.`,
      };
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
