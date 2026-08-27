import { LlmAgent } from "@google/adk";
import { GEMINI_MODEL } from "../../../config/env.js";
import { BASE_SYSTEM_PROMPT } from "../../prompts/system.prompt.js";
import { ORDER_AGENT_PROMPT } from "../../prompts/order.prompt.js";
import {
  adkSearchMenuTool,
  adkGetMenuItemTool,
  adkCheckMenuAvailabilityTool,
  adkSearchDealsTool,
  adkGetDealTool,
  adkCreateOrderTool,
  adkGetOrderTool,
  adkGetCustomerOrdersTool,
  adkCancelOrderTool,
  adkEscalateConversationTool,
} from "../tools/index.js";

export const orderAgent = new LlmAgent({
  name: "order_agent",
  model: GEMINI_MODEL || "gemini-2.5-flash",
  description:
    "Handles all live menu and order operations: menu browsing, dish prices, item availability in stock, promotional deals and combo offers, placing food orders, tracking order status, order history, and cancelling orders. Route here for live menu or order tasks.",
  instruction: (context) => {
    const restaurantName =
      context.session?.state?.restaurantName || "our restaurant";
    const customerContextText =
      context.session?.state?.customerContextText || "";

    return `${BASE_SYSTEM_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName)}

${ORDER_AGENT_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName)}

RESTAURANT NAME: ${restaurantName}

${customerContextText ? `CUSTOMER CONTEXT:\n${customerContextText}\n` : ""}

============================================================
DATABASE TOOL RULES
============================================================
1. SOURCE OF TRUTH:
   - Always call the appropriate database tool to retrieve live data.
   - For prices: always check getMenuItem or searchMenu. Never guess or fabricate prices.
   - For availability: always check checkMenuAvailability.
   - For deals: always check searchDeals or getDeal.
   - For placing orders: use createOrder.
   - For order status: use getOrder.
   - For order history: use getCustomerOrders.

2. TELEGRAM HTML FORMATTING:
   - Use ONLY Telegram HTML tags (<b>bold</b>, <i>italic</i>, <code>code</code>, <blockquote>quote</blockquote>, • bullet items).
   - Do NOT output Markdown (no #, **, *, _, \`\`\`).
   - State prices clearly in Rs. (PKR).`;
  },
  tools: [
    adkSearchMenuTool,
    adkGetMenuItemTool,
    adkCheckMenuAvailabilityTool,
    adkSearchDealsTool,
    adkGetDealTool,
    adkCreateOrderTool,
    adkGetOrderTool,
    adkGetCustomerOrdersTool,
    adkCancelOrderTool,
    adkEscalateConversationTool,
  ],
  generateContentConfig: {
    temperature: 0.3,
    maxOutputTokens: 1024,
  },
});
