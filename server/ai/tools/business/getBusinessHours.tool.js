import prisma from "../../../config/prisma.js";

export const getBusinessHoursTool = {
  name: "getBusinessHours",
  description: "Retrieves exact opening and closing operating hours for the restaurant by day of week.",
  execute: async ({ businessId, dayOfWeek }) => {
    const where = { businessId };
    if (dayOfWeek) {
      where.dayOfWeek = dayOfWeek.toUpperCase();
    }

    const hours = await prisma.businessHour.findMany({ where });
    if (hours.length === 0) {
      return { message: "Operating hours not set for this restaurant." };
    }

    return hours.map((h) => ({
      dayOfWeek: h.dayOfWeek,
      isOpen: h.isOpen,
      openTime: h.isOpen ? h.open || "09:00" : "Closed",
      closeTime: h.isOpen ? h.close || "22:00" : "Closed",
    }));
  },
};
