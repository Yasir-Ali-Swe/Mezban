import { FunctionTool } from "@google/adk";
import { searchMenuTool } from "../../tools/menu/searchMenu.tool.js";
import { getMenuItemTool } from "../../tools/menu/getMenuItem.tool.js";
import { checkMenuAvailabilityTool } from "../../tools/menu/checkMenuAvailability.tool.js";
import { getToolSessionState } from "./context.helper.js";

/**
 * ADK FunctionTool wrapper: searchMenu
 * Structured database tool for browsing current menu items and categories.
 */
export const adkSearchMenuTool = new FunctionTool({
  name: "searchMenu",
  description:
    "Searches available food menu items by keyword query or category. Use this tool when the user asks to see the menu, browse dishes, or find items in a category (e.g. 'show me the menu', 'what burgers do you have?').",
  parameters: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query for dish name or ingredients (e.g. 'burger', 'karahi', 'biryani')",
      },
      categoryName: {
        type: "string",
        description: "Optional category name to filter by (e.g. 'Desi', 'Fast Food', 'Beverages')",
      },
      limit: {
        type: "number",
        description: "Optional maximum number of menu items to return (default 10)",
      },
    },
  },
  execute: async ({ query, categoryName, limit } = {}, tool_context) => {
    const { businessId } = getToolSessionState(tool_context);
    if (!businessId) return { success: false, error: "MISSING_BUSINESS_ID", message: "Restaurant session context missing." };
    return searchMenuTool.execute({ businessId, query, categoryName, limit });
  },
});

/**
 * ADK FunctionTool wrapper: getMenuItem
 * Structured database tool for item pricing and description.
 */
export const adkGetMenuItemTool = new FunctionTool({
  name: "getMenuItem",
  description:
    "Gets exact pricing, category, and availability details for a specific menu item from the restaurant database. Use this when the user asks 'how much is [dish]?' or asks for details on a specific item.",
  parameters: {
    type: "object",
    properties: {
      itemName: {
        type: "string",
        description: "Name of the menu item to look up (e.g. 'Chicken Karahi', 'Beef Burger')",
      },
      itemId: {
        type: "string",
        description: "Optional menu item database ID if known",
      },
    },
  },
  execute: async ({ itemName, itemId } = {}, tool_context) => {
    const { businessId } = getToolSessionState(tool_context);
    if (!businessId) return { success: false, error: "MISSING_BUSINESS_ID", message: "Restaurant session context missing." };
    return getMenuItemTool.execute({ businessId, itemName, itemId });
  },
});

/**
 * ADK FunctionTool wrapper: checkMenuAvailability
 * Structured database tool for checking if an item is currently available in stock.
 */
export const adkCheckMenuAvailabilityTool = new FunctionTool({
  name: "checkMenuAvailability",
  description:
    "Checks if a specific dish or menu item is currently available in stock. Use this when the user asks 'is [dish] available?' or 'do you have [dish] in stock?'.",
  parameters: {
    type: "object",
    properties: {
      itemName: {
        type: "string",
        description: "Name of the dish to check availability for (e.g. 'Mutton Biryani')",
      },
    },
    required: ["itemName"],
  },
  execute: async ({ itemName } = {}, tool_context) => {
    const { businessId } = getToolSessionState(tool_context);
    if (!businessId) return { success: false, error: "MISSING_BUSINESS_ID", message: "Restaurant session context missing." };
    return checkMenuAvailabilityTool.execute({ businessId, itemName });
  },
});
