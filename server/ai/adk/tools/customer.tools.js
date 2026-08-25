import { FunctionTool } from "@google/adk";
import { getCustomerTool } from "../../tools/customer/getCustomer.tool.js";
import { createCustomerTool } from "../../tools/customer/createCustomer.tool.js";
import { getToolSessionState } from "./context.helper.js";

/**
 * ADK FunctionTool wrapper: getCustomer
 */
export const adkGetCustomerTool = new FunctionTool({
  name: "getCustomer",
  description: "Retrieves customer profile and contact details from the restaurant database.",
  parameters: {
    type: "object",
    properties: {},
  },
  execute: async (_args, tool_context) => {
    const { businessId, customerId } = getToolSessionState(tool_context);
    if (!businessId || !customerId) {
      return { success: false, error: "MISSING_CUSTOMER_CONTEXT", message: "Customer and business context required." };
    }
    return getCustomerTool.execute({ customerId, businessId });
  },
});

/**
 * ADK FunctionTool wrapper: createCustomer
 */
export const adkCreateCustomerTool = new FunctionTool({
  name: "createCustomer",
  description: "Upserts customer profile data for phone or email contact details.",
  parameters: {
    type: "object",
    properties: {
      name: {
        type: "string",
        description: "Customer name",
      },
      phone: {
        type: "string",
        description: "Customer phone number",
      },
      email: {
        type: "string",
        description: "Customer email address",
      },
    },
  },
  execute: async ({ name, phone, email } = {}, tool_context) => {
    const { businessId, telegramChatId } = getToolSessionState(tool_context);
    if (!businessId || !telegramChatId) {
      return { success: false, error: "MISSING_SESSION_CONTEXT", message: "Business ID and Telegram chat ID required." };
    }
    return createCustomerTool.execute({ businessId, telegramChatId, name, phone, email });
  },
});
