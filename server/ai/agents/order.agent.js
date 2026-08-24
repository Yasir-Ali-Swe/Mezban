import { GEMINI_API_KEY, GEMINI_MODEL } from "../../config/env.js";
import { BASE_SYSTEM_PROMPT } from "../prompts/system.prompt.js";
import { ORDER_AGENT_PROMPT } from "../prompts/order.prompt.js";

export async function runOrderAgent({
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
    console.error("[Order Agent] GEMINI_API_KEY is missing.");
    return fallbackResponse(safeRestaurantName);
  }

  const basePrompt = BASE_SYSTEM_PROMPT.replace(/{RESTAURANT_NAME}/g, safeRestaurantName);
  const agentPrompt = ORDER_AGENT_PROMPT.replace(/{RESTAURANT_NAME}/g, safeRestaurantName);

  const promptText = `
${basePrompt}
${agentPrompt}

RESTAURANT NAME: ${safeRestaurantName}

${customerContextText ? `CUSTOMER INFO:\n${customerContextText}\n` : ""}
${conversationHistoryText ? `CONVERSATION HISTORY:\n${conversationHistoryText}\n` : ""}
${ragContextText ? `KNOWLEDGE BASE CONTEXT:\n${ragContextText}\n` : ""}
${toolResultText ? `TOOL EXECUTION RESULT (STRUCTURED ORDER/MENU DATA):\n${toolResultText}\n` : ""}

USER QUERY:
"${userQuery}"

FORMATTING DIRECTIVES:
- Use ONLY Telegram HTML formatting (<b>bold</b>, <i>italic</i>, <code>code</code>, <blockquote>quote</blockquote>, • bullet items).
- Do NOT output Markdown (no #, **, *, _, \`\`\`).
- State dish names, prices in Rs. (PKR), order totals, and status updates clearly to the customer.
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.2, maxOutputTokens: 400 },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("[Order Agent Gemini Error]", {
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

    console.warn("[Order Agent] Gemini returned an empty response.");
    return fallbackResponse(safeRestaurantName);
  } catch (err) {
    console.error("[Order Agent Exception]:", err.message);
    return fallbackResponse(safeRestaurantName);
  }
}

function fallbackResponse(restaurantName) {
  return `<b>Menu & Orders</b>

How can I assist you with your order at <b>${escapeHtml(restaurantName)}</b>?

• 🍽️ Browse menu items
• 🏷️ View promotional deals
• 🛒 Place an order
• 📦 Track order status`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
