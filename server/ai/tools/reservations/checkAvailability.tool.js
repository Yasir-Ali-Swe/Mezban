import prisma from "../../../config/prisma.js";

export const checkAvailabilityTool = {
  name: "checkAvailability",
  description: "Checks if a dining table is available for reservation on a specified date, time, and guest count.",
  execute: async ({ businessId, date, time, guestCount }) => {
    const requestedDate = date ? new Date(date) : new Date();
    const guests = parseInt(guestCount) || 2;

    // Check operating hours for day of week
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const dayName = days[requestedDate.getDay()];

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
        available: false,
        message: `Sorry, the restaurant is closed on ${dayName}s.`,
      };
    }

    return {
      available: true,
      dayOfWeek: dayName,
      openTime: hour?.open || "09:00",
      closeTime: hour?.close || "22:00",
      requestedGuests: guests,
      message: `Table is available for ${guests} guests on ${dayName}.`,
    };
  },
};
