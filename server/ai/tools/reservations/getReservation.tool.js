import prisma from "../../../config/prisma.js";

/**
 * Retrieves details and status of a table reservation.
 * Enforces businessId and customerId isolation.
 */
export const getReservationTool = {
  name: "getReservation",
  description: "Fetches details and status of a table reservation by reservation number or latest booking.",
  execute: async ({ businessId, reservationNumber, customerId }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    const where = {
      businessId,
      ...(reservationNumber ? { reservationNumber: reservationNumber.trim() } : {}),
      ...(customerId ? { customerId } : {}),
    };

    const reservation = await prisma.reservation.findFirst({
      where,
      orderBy: { createdAt: "desc" },
      include: { customer: true },
    });

    if (!reservation) {
      return {
        success: false,
        error: "RESERVATION_NOT_FOUND",
        message: reservationNumber
          ? `Reservation #${reservationNumber} was not found or does not belong to your account.`
          : "No table reservation found for your account.",
      };
    }

    const formattedDate = reservation.reservationAt.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    const formattedTime = reservation.reservationAt.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });

    return {
      success: true,
      reservation: {
        reservationId: reservation.id,
        reservationNumber: reservation.reservationNumber,
        customerName: reservation.customer?.name || "Customer",
        guestCount: reservation.guestCount,
        reservationAt: reservation.reservationAt.toISOString(),
        dateFormatted: formattedDate,
        timeFormatted: formattedTime,
        status: reservation.status,
        notes: reservation.notes || "",
      },
      message: `Reservation #${reservation.reservationNumber} for ${reservation.guestCount} guests on ${formattedDate} at ${formattedTime} is currently '${reservation.status}'.`,
    };
  },
};
