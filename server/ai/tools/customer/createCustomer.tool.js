import prisma from "../../../config/prisma.js";

/**
 * Upserts customer profile data for phone or email contact details.
 */
export const createCustomerTool = {
  name: "createCustomer",
  description: "Upserts customer profile data for phone or email contact details.",
  execute: async ({ businessId, telegramChatId, name, phone, email }) => {
    if (!businessId || !telegramChatId) {
      return { success: false, error: "MISSING_IDENTIFIER", message: "Business ID and Telegram chat ID are required." };
    }

    let customer = await prisma.customer.findFirst({
      where: { businessId, telegramChatId },
    });

    if (customer) {
      customer = await prisma.customer.update({
        where: { id: customer.id },
        data: {
          name: name || customer.name,
          phone: phone || customer.phone,
          email: email || customer.email,
        },
      });
    } else {
      customer = await prisma.customer.create({
        data: {
          businessId,
          telegramChatId,
          name: name || "Telegram User",
          phone: phone || null,
          email: email || null,
        },
      });
    }

    return {
      success: true,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone || "",
        email: customer.email || "",
      },
    };
  },
};
