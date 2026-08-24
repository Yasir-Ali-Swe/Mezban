import { GEMINI_API_KEY, GEMINI_MODEL } from "../../config/env.js";
import { BASE_SYSTEM_PROMPT } from "../prompts/system.prompt.js";
import { RESERVATION_AGENT_PROMPT } from "../prompts/reservation.prompt.js";

export async function runReservationAgent({
  userQuery,
  restaurantName,
  conversationHistoryText,
  customerContextText,
  ragContextText,
  toolResultText,
}) {
  const safeRestaurantName = restaurantName || "our restaurant";
  const modelName = GEMINI_MODEL || "gemini-1.5-flash";
  const apiKey = GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[Reservation Agent] GEMINI_API_KEY is missing.");
    return fallbackResponse(safeRestaurantName);
  }

  const basePrompt = BASE_SYSTEM_PROMPT.replace(/{RESTAURANT_NAME}/g, safeRestaurantName);
  const agentPrompt = RESERVATION_AGENT_PROMPT.replace(/{RESTAURANT_NAME}/g, safeRestaurantName);

  const promptText = `
${basePrompt}
${agentPrompt}

RESTAURANT NAME: ${safeRestaurantName}

${customerContextText ? `CUSTOMER INFO:\n${customerContextText}\n` : ""}
${conversationHistoryText ? `CONVERSATION HISTORY:\n${conversationHistoryText}\n` : ""}
${ragContextText ? `KNOWLEDGE BASE CONTEXT:\n${ragContextText}\n` : ""}
${toolResultText ? `TOOL EXECUTION RESULT (RESERVATION DETAILS):\n${toolResultText}\n` : ""}

USER QUERY:
"${userQuery}"

FORMATTING DIRECTIVES:
- Use ONLY Telegram HTML formatting (<b>bold</b>, <i>italic</i>, <code>code</code>, <blockquote>quote</blockquote>, • bullet items).
- Do NOT output Markdown (no #, **, *, _, \`\`\`).
- State reservation date, time, guest count, reservation number, and status clearly to the customer.
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 350 },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Reservation Agent Gemini Error]", {
        status: response.status,
        message: data?.error?.message || "Gemini API request failed",
      });
      return fallbackResponse(safeRestaurantName);
    }

    const replyText =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

    if (replyText) return replyText;

    console.warn("[Reservation Agent] Gemini returned an empty response.");
    return fallbackResponse(safeRestaurantName);
  } catch (err) {
    console.error("[Reservation Agent Exception]:", err.message);
    return fallbackResponse(safeRestaurantName);
  }
}

function fallbackResponse(restaurantName) {
  return `<b>🪑 Table Reservations</b>

How can I help with your table booking at <b>${escapeHtml(restaurantName)}</b>?

• Check table availability for date & time
• Reserve a table for your party
• Cancel or view reservation status`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
