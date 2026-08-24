import prisma from "../../../config/prisma.js";

export const createCustomerTool = {
  name: "createCustomer",
  description: "Upserts customer profile data for phone or email contact details.",
  execute: async ({ businessId, telegramChatId, name, phone, email }) => {
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
      customerId: customer.id,
      name: customer.name,
      phone: customer.phone,
    };
  },
};
