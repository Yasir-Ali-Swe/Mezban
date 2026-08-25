import { FunctionTool } from "@google/adk";
import { searchDealsTool } from "../../tools/deals/searchDeals.tool.js";
import { getDealTool } from "../../tools/deals/getDeal.tool.js";
import { getToolSessionState } from "./context.helper.js";

/**
 * ADK FunctionTool wrapper: searchDeals
 */
export const adkSearchDealsTool = new FunctionTool({
  name: "searchDeals",
  description:
    "Searches active promotional deals, discount packages, and combo offers currently available at the restaurant. Use this when the user asks about deals or offers.",
  parameters: {
    type: "object",
    properties: {},
  },
  execute: async (_args, tool_context) => {
    const { businessId } = getToolSessionState(tool_context);
    if (!businessId) return { success: false, error: "MISSING_BUSINESS_ID", message: "Restaurant session context missing." };
    return searchDealsTool.execute({ businessId });
  },
});

/**
 * ADK FunctionTool wrapper: getDeal
 */
export const adkGetDealTool = new FunctionTool({
  name: "getDeal",
  description: "Fetches details, pricing, and item breakdown included in a specific promotional deal.",
  parameters: {
    type: "object",
    properties: {
      dealName: {
        type: "string",
        description: "Name of the deal to look up (e.g. 'Family Deal', 'Lunch Special')",
      },
      dealId: {
        type: "string",
        description: "Optional deal database ID if known",
      },
    },
  },
  execute: async ({ dealName, dealId } = {}, tool_context) => {
    const { businessId } = getToolSessionState(tool_context);
    if (!businessId) return { success: false, error: "MISSING_BUSINESS_ID", message: "Restaurant session context missing." };
    return getDealTool.execute({ businessId, dealName, dealId });
  },
});
