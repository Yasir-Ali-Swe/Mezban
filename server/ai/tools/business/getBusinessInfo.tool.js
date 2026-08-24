import prisma from "../../../config/prisma.js";

export const getBusinessInfoTool = {
  name: "getBusinessInfo",
  description: "Retrieves basic profile information for the restaurant (name, contact, address, city).",
  execute: async ({ businessId }) => {
    const business = await prisma.business.findUnique({
      where: { id: businessId },
    });
    if (!business) return { error: "Business not found" };

    return {
      name: business.name,
      email: business.email,
      phone: business.phone,
      address: business.address,
      city: business.city,
      country: business.country,
      website: business.website,
    };
  },
};
