import prisma from "../../../config/prisma.js";

/**
 * Creates a new confirmed table reservation for a customer.
 * Enforces businessId and customerId isolation.
 */
export const createReservationTool = {
  name: "createReservation",
  description: "Creates a new table reservation for a customer.",
  execute: async ({
    businessId,
    customerId,
    reservationDate,
    reservationTime,
    guestCount = 2,
    notes,
  }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    if (!customerId) {
      return { success: false, error: "MISSING_CUSTOMER_ID", message: "Customer context is required to book a reservation." };
    }

    // 1. Verify customer exists
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });

    if (!customer) {
      return { success: false, error: "CUSTOMER_NOT_FOUND", message: "Customer profile not found for this restaurant." };
    }

    // 2. Parse Date and Time
    let reservationAt = new Date();
    if (reservationDate) {
      const timeStr = reservationTime ? reservationTime.trim() : "20:00";
      const fullDateStr = `${reservationDate.trim()}T${timeStr.length === 5 ? timeStr + ":00" : timeStr}`;
      const parsed = new Date(fullDateStr);
      if (!isNaN(parsed.getTime())) {
        reservationAt = parsed;
      } else {
        const fallback = new Date(reservationDate);
        if (!isNaN(fallback.getTime())) {
          reservationAt = fallback;
        }
      }
    }

    const guests = Math.max(1, parseInt(guestCount) || 2);

    // 3. Generate unique reservation number (e.g. RES-M1AB2-5432)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timePart = Date.now().toString(36).toUpperCase().slice(-5);
    const reservationNumber = `RES-${timePart}-${randomSuffix}`;

    try {
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
        reservationNumber: reservation.reservationNumber,
        reservationId: reservation.id,
        guestCount: reservation.guestCount,
        reservationAt: reservation.reservationAt.toISOString(),
        dateFormatted: formattedDate,
        timeFormatted: formattedTime,
        status: reservation.status,
        customerName: reservation.customer?.name || "Customer",
        notes: reservation.notes || "",
        message: `Table reservation #${reservation.reservationNumber} confirmed for ${guests} guests on ${formattedDate} at ${formattedTime}!`,
      };
    } catch (err) {
      console.error("[createReservation Error]:", err);
      return {
        success: false,
        error: "RESERVATION_FAILED",
        message: "Failed to book the reservation due to a system error. Please try again.",
      };
    }
  },
};
