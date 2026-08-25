import { LlmAgent } from "@google/adk";
import { GEMINI_MODEL } from "../../../config/env.js";
import { BASE_SYSTEM_PROMPT } from "../../prompts/system.prompt.js";
import { RESERVATION_AGENT_PROMPT } from "../../prompts/reservation.prompt.js";
import {
  adkCheckAvailabilityTool,
  adkCreateReservationTool,
  adkGetReservationTool,
  adkCancelReservationTool,
  adkEscalateConversationTool,
} from "../tools/index.js";

/**
 * Reservation Agent — ADK LlmAgent.
 *
 * Responsibilities:
 * - Informing customers about table reservations (currently paused)
 * - Viewing existing reservation details (getReservation)
 * - Cancelling reservations (cancelReservation)
 *
 * Note: All reservation tools and database schemas remain fully intact.
 */
export const reservationAgent = new LlmAgent({
  name: "reservation_agent",
  model: GEMINI_MODEL || "gemini-2.5-flash",
  description:
    "Handles table reservation inquiries, existing reservation status checks, and cancellations. (Table bookings are currently paused).",
  disallowTransferToParent: true,
  disallowTransferToPeers: true,
  instruction: (context) => {
    const restaurantName =
      context.session?.state?.restaurantName || "our restaurant";
    const customerContextText =
      context.session?.state?.customerContextText || "";

    return `${BASE_SYSTEM_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName)}

${RESERVATION_AGENT_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName)}

RESTAURANT NAME: ${restaurantName}

${customerContextText ? `CUSTOMER CONTEXT:\n${customerContextText}\n` : ""}

============================================================
RESERVATION RULES
============================================================
1. BOOKING REQUESTS:
   - When the customer wants to reserve a table or make a booking, inform them that reservations are temporarily paused at the moment and guide them toward online ordering.
   - Do NOT call createReservation.

2. EXISTING BOOKINGS:
   - For status lookups on previous reservations: call getReservation.
   - For cancelling previous reservations: call cancelReservation.

3. TELEGRAM HTML FORMATTING:
   - Use ONLY Telegram HTML tags (<b>bold</b>, <i>italic</i>, <code>code</code>, <blockquote>quote</blockquote>, • bullet items).
   - Do NOT output Markdown (no #, **, *, _, \`\`\`).`;
  },
  tools: [
    adkCheckAvailabilityTool,
    adkCreateReservationTool,
    adkGetReservationTool,
    adkCancelReservationTool,
    adkEscalateConversationTool,
  ],
  generateContentConfig: {
    temperature: 0.2,
    maxOutputTokens: 700,
  },
});
