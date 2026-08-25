import { FunctionTool } from "@google/adk";
import { getBusinessInfoTool } from "../../tools/business/getBusinessInfo.tool.js";
import { getBusinessHoursTool } from "../../tools/business/getBusinessHours.tool.js";
import { getToolSessionState } from "./context.helper.js";

/**
 * ADK FunctionTool wrapper: getBusinessInfo
 * Retrieves basic restaurant profile information (address, phone, email, website).
 */
export const adkGetBusinessInfoTool = new FunctionTool({
  name: "getBusinessInfo",
  description:
    "Retrieves basic contact and location information for the restaurant (address, city, phone, email, website). Use this for contact, address, or broad restaurant overview inquiries.",
  parameters: {
    type: "object",
    properties: {},
  },
  execute: async (_args, tool_context) => {
    const { businessId } = getToolSessionState(tool_context);
    if (!businessId) return { success: false, error: "MISSING_BUSINESS_ID", message: "Restaurant session context missing." };
    return getBusinessInfoTool.execute({ businessId });
  },
});

/**
 * ADK FunctionTool wrapper: getBusinessHours
 * Retrieves exact structured operating hours for the restaurant from the database.
 */
export const adkGetBusinessHoursTool = new FunctionTool({
  name: "getBusinessHours",
  description:
    "Retrieves exact opening and closing operating hours for the restaurant by day of week. Use this tool whenever the customer asks about opening hours, closing times, or when the restaurant is open.",
  parameters: {
    type: "object",
    properties: {
      dayOfWeek: {
        type: "string",
        description:
          "Optional specific day of week (e.g. MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY). Leave empty to get operating hours for all days.",
      },
    },
  },
  execute: async ({ dayOfWeek } = {}, tool_context) => {
    const { businessId } = getToolSessionState(tool_context);
    if (!businessId) return { success: false, error: "MISSING_BUSINESS_ID", message: "Restaurant session context missing." };
    return getBusinessHoursTool.execute({ businessId, dayOfWeek });
  },
});
