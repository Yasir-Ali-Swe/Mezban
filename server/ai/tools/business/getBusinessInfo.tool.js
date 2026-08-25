import prisma from "../../../config/prisma.js";

/**
 * Retrieves restaurant profile information (name, address, city, phone, email, website).
 */
export const getBusinessInfoTool = {
  name: "getBusinessInfo",
  description: "Retrieves basic profile and contact information for the restaurant.",
  execute: async ({ businessId }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    const business = await prisma.business.findUnique({
      where: { id: businessId },
      include: {
        hours: true,
      },
    });

    if (!business) {
      return { success: false, error: "BUSINESS_NOT_FOUND", message: "Restaurant profile not found." };
    }

    return {
      success: true,
      name: business.name || "Restaurant",
      email: business.email || "",
      phone: business.phone || "",
      address: business.address || "",
      city: business.city || "",
      country: business.country || "",
      website: business.website || "",
      hours: (business.hours || []).map((h) => ({
        dayOfWeek: h.dayOfWeek,
        isOpen: h.isOpen,
        openTime: h.isOpen ? h.open || "09:00" : "Closed",
        closeTime: h.isOpen ? h.close || "22:00" : "Closed",
      })),
    };
  },
};
