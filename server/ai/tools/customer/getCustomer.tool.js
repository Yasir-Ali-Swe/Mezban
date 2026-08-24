import prisma from "../../../config/prisma.js";

export const getCustomerTool = {
  name: "getCustomer",
  description: "Retrieves customer profile and contact information.",
  execute: async ({ customerId, businessId }) => {
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });
    if (!customer) return { error: "Customer record not found" };

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      telegramChatId: customer.telegramChatId,
    };
  },
};
