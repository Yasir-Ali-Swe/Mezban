import prisma from "../../../config/prisma.js";

/**
 * Retrieves exact structured operating hours for the restaurant by day of week.
 */
export const getBusinessHoursTool = {
  name: "getBusinessHours",
  description: "Retrieves exact opening and closing operating hours for the restaurant by day of week.",
  execute: async ({ businessId, dayOfWeek }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    const where = { businessId };
    if (dayOfWeek && typeof dayOfWeek === "string") {
      const cleanDay = dayOfWeek.trim().toUpperCase();
      const validDays = ["MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY", "SUNDAY"];
      if (validDays.includes(cleanDay)) {
        where.dayOfWeek = cleanDay;
      }
    }

    const hours = await prisma.businessHour.findMany({
      where,
      orderBy: { dayOfWeek: "asc" },
    });

    if (hours.length === 0) {
      return {
        success: true,
        message: "Operating hours are not configured for this restaurant.",
        hours: [],
      };
    }

    return {
      success: true,
      hours: hours.map((h) => ({
        dayOfWeek: h.dayOfWeek,
        isOpen: h.isOpen,
        openTime: h.isOpen ? h.open || "09:00" : "Closed",
        closeTime: h.isOpen ? h.close || "22:00" : "Closed",
        statusText: h.isOpen ? `${h.open || "09:00"} to ${h.close || "22:00"}` : "Closed",
      })),
    };
  },
};
