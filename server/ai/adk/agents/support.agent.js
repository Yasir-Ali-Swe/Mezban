import { LlmAgent } from "@google/adk";
import { GEMINI_MODEL } from "../../../config/env.js";
import { BASE_SYSTEM_PROMPT } from "../../prompts/system.prompt.js";
import { SUPPORT_AGENT_PROMPT } from "../../prompts/support.prompt.js";
import {
  adkGetOrderTool,
  adkGetCustomerOrdersTool,
  adkGetReservationTool,
  adkGetBusinessInfoTool,
} from "../tools/index.js";

/**
 * Support Agent — ADK LlmAgent.
 *
 * Responsibilities:
 * - Handling customer complaints and order issues
 * - Order status lookups (getOrder, getCustomerOrders)
 * - Reservation lookups (getReservation)
 * - Restaurant contact and assistance (getBusinessInfo)
 * - Empathetic customer support and staff escalation
 */
export const supportAgent = new LlmAgent({
  name: "support_agent",
  model: GEMINI_MODEL || "gemini-2.5-flash",
  description:
    "Handles customer complaints, order issues, human assistance escalation, order tracking, reservation lookups, and support requests. Route here for customer support requests, problems, or complaints.",
  disallowTransferToParent: true,
  disallowTransferToPeers: true,
  instruction: (context) => {
    const restaurantName =
      context.session?.state?.restaurantName || "our restaurant";
    const customerContextText =
      context.session?.state?.customerContextText || "";

    return `${BASE_SYSTEM_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName)}

${SUPPORT_AGENT_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName)}

RESTAURANT NAME: ${restaurantName}

${customerContextText ? `CUSTOMER CONTEXT:\n${customerContextText}\n` : ""}

============================================================
SUPPORT TOOL RULES
============================================================
1. LIVE STATUS LOOKUPS:
   - For order status / tracking: call getOrder or getCustomerOrders.
   - For reservation status / lookup: call getReservation.
   - For restaurant contact details / manager reach-out: call getBusinessInfo.
   - For issues requiring human intervention, assure the customer politely that staff will follow up.

2. TELEGRAM HTML FORMATTING:
   - Use ONLY Telegram HTML tags (<b>bold</b>, <i>italic</i>, <code>code</code>, <blockquote>quote</blockquote>, • bullet items).
   - Do NOT output Markdown (no #, **, *, _, \`\`\`).`;
  },
  tools: [adkGetOrderTool, adkGetCustomerOrdersTool, adkGetReservationTool, adkGetBusinessInfoTool],
  generateContentConfig: {
    temperature: 0.3,
    maxOutputTokens: 700,
  },
});
