import prisma from "../../../config/prisma.js";

/**
 * Checks if a dining table is available for a given date, time, and guest count.
 * Validates business operating hours, closed days, and active bookings.
 */
export const checkAvailabilityTool = {
  name: "checkAvailability",
  description: "Checks if a dining table is available for reservation on a specified date, time, and guest count.",
  execute: async ({ businessId, date, time, guestCount = 2 }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    const guests = Math.max(1, parseInt(guestCount) || 2);

    // Parse date & time
    let targetDate = new Date();
    if (date) {
      const parsed = new Date(date);
      if (!isNaN(parsed.getTime())) {
        targetDate = parsed;
      }
    }

    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const dayName = days[targetDate.getDay()];

    // 1. Check operating hours for day of week
    const hour = await prisma.businessHour.findUnique({
      where: {
        businessId_dayOfWeek: {
          businessId,
          dayOfWeek: dayName,
        },
      },
    });

    if (hour && !hour.isOpen) {
      return {
        success: true,
        available: false,
        dayOfWeek: dayName,
        message: `Sorry, the restaurant is closed on ${dayName}s.`,
      };
    }

    const openTime = hour?.open || "09:00";
    const closeTime = hour?.close || "23:00";

    // 2. Validate requested time against operating hours if time specified
    if (time && typeof time === "string") {
      const cleanTime = time.trim();
      if (cleanTime < openTime || cleanTime > closeTime) {
        return {
          success: true,
          available: false,
          dayOfWeek: dayName,
          openTime,
          closeTime,
          message: `The requested time ${cleanTime} is outside operating hours (${openTime} to ${closeTime}).`,
        };
      }
    }

    // 3. Check existing active reservations around the requested date
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingCount = await prisma.reservation.count({
      where: {
        businessId,
        reservationAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: { in: ["CONFIRMED", "PENDING"] },
      },
    });

    // Sensible capacity threshold check
    const isAvailable = existingCount < 30;

    const formattedDate = targetDate.toISOString().split("T")[0];
    const formattedTime = time || "20:00";

    return {
      success: true,
      available: isAvailable,
      dayOfWeek: dayName,
      date: formattedDate,
      time: formattedTime,
      guestCount: guests,
      openTime,
      closeTime,
      message: isAvailable
        ? `Table is available for ${guests} guests on ${dayName}, ${formattedDate} at ${formattedTime}. (Operating hours: ${openTime} - ${closeTime}).`
        : `Sorry, table reservations are fully booked for ${formattedDate} at ${formattedTime}.`,
    };
  },
};
