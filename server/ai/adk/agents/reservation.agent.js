import { LlmAgent } from "@google/adk";
import { GEMINI_MODEL } from "../../../config/env.js";
import { BASE_SYSTEM_PROMPT } from "../../prompts/system.prompt.js";
import { RESERVATION_AGENT_PROMPT } from "../../prompts/reservation.prompt.js";
import {
  adkCheckAvailabilityTool,
  adkCreateReservationTool,
  adkGetReservationTool,
  adkCancelReservationTool,
} from "../tools/index.js";

/**
 * Reservation Agent — ADK LlmAgent.
 *
 * Responsibilities:
 * - Table availability checks for date/time/guests (checkAvailability)
 * - Booking / creating table reservations (createReservation)
 * - Viewing reservation details (getReservation)
 * - Cancelling reservations (cancelReservation)
 */
export const reservationAgent = new LlmAgent({
  name: "reservation_agent",
  model: GEMINI_MODEL || "gemini-2.5-flash",
  description:
    "Handles live table reservation operations: checking table availability for a specific date, time, and guest count; creating table reservations; viewing reservation details; and cancelling reservations. Route here for booking tables or checking live table availability.",
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
DATABASE RESERVATION TOOL RULES
============================================================
1. LIVE OPERATIONS:
   - To check table availability for a specific date/time: call checkAvailability.
   - To create a booking: call createReservation.
   - To look up a reservation: call getReservation.
   - To cancel a reservation: call cancelReservation.

2. TELEGRAM HTML FORMATTING:
   - Use ONLY Telegram HTML tags (<b>bold</b>, <i>italic</i>, <code>code</code>, <blockquote>quote</blockquote>, • bullet items).
   - Do NOT output Markdown (no #, **, *, _, \`\`\`).
   - State reservation date, time, guest count, reservation number, and status clearly.`;
  },
  tools: [
    adkCheckAvailabilityTool,
    adkCreateReservationTool,
    adkGetReservationTool,
    adkCancelReservationTool,
  ],
  generateContentConfig: {
    temperature: 0.2,
    maxOutputTokens: 350,
  },
});
