import { GEMINI_API_KEY, GEMINI_MODEL } from "../../config/env.js";
import { BASE_SYSTEM_PROMPT } from "../prompts/system.prompt.js";
import { GENERAL_AGENT_PROMPT } from "../prompts/general.prompt.js";

export async function runGeneralAgent({
  userQuery,
  restaurantName,
  conversationHistoryText,
  customerContextText,
  ragContextText,
  toolResultText,
  intent,
  isNewConversation,
}) {
  const safeRestaurantName = restaurantName || "our restaurant";

  // ============================================================
  // GREETING FAST PATH
  // ============================================================

  if (intent === "GREETING") {
    const hasHistory =
      typeof conversationHistoryText === "string" &&
      conversationHistoryText.trim().length > 0;

    if (isNewConversation || !hasHistory) {
      return `<b>Hello! 👋</b>

I'm the AI assistant for <b>${escapeHtml(safeRestaurantName)}</b>.

I can help you with:

• 🍽️ <b>Menu & Food</b> — dishes, prices, and availability
• 🚚 <b>Delivery</b> — delivery areas, fees, and timings
• 💳 <b>Payments</b> — available payment methods
• 🕐 <b>Opening Hours</b> — restaurant timings
• 🪑 <b>Reservations</b> — table availability and bookings
• 🛒 <b>Orders</b> — placing, tracking, and managing orders

<b>How can I help you today?</b>`;
    }

    return `<b>Hi! 👋</b>

How can I help you today?`;
  }

  // ============================================================
  // GEMINI CONFIGURATION
  // ============================================================

  const modelName = GEMINI_MODEL || "gemini-2.5-flash";
  const apiKey = GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[General Agent] GEMINI_API_KEY is missing.");
    return fallbackResponse();
  }

  // ============================================================
  // PROMPTS
  // ============================================================

  const basePrompt = BASE_SYSTEM_PROMPT.replace(
    /{RESTAURANT_NAME}/g,
    safeRestaurantName
  );

  const agentPrompt = GENERAL_AGENT_PROMPT.replace(
    /{RESTAURANT_NAME}/g,
    safeRestaurantName
  );

  const promptText = `
${basePrompt}

${agentPrompt}

============================================================
RESTAURANT
============================================================

${safeRestaurantName}

============================================================
CONVERSATION HISTORY
============================================================

${conversationHistoryText || "No previous conversation."}

============================================================
CUSTOMER CONTEXT
============================================================

${customerContextText || "No additional customer context."}

============================================================
KNOWLEDGE BASE CONTEXT
============================================================

${ragContextText || "No knowledge context was retrieved."}

============================================================
TOOL EXECUTION RESULT
============================================================

${toolResultText || "No tool was executed."}

============================================================
CUSTOMER QUERY
============================================================

${userQuery}

============================================================
CURRENT INTENT
============================================================

${intent || "BUSINESS_INFORMATION"}

============================================================
FINAL INSTRUCTIONS
============================================================

Answer the customer query directly.

Use the supplied knowledge context as the source of truth.

If the answer is available in the knowledge context, answer it accurately.

If the answer is not available, do not guess.

Keep the answer concise.

Return ONLY the customer-facing response.

Make sure every HTML opening tag has a matching closing tag.

Before returning the response, internally verify:

- Every <b> has </b>
- Every <strong> has </strong>
- Every <i> has </i>
- Every <em> has </em>
- Every <u> has </u>
- Every <s> has </s>
- Every <del> has </del>
- Every <ins> has </ins>
- Every <code> has </code>
- Every <pre> has </pre>
- Every <blockquote> has </blockquote>

Never return incomplete HTML.
`;

  // ============================================================
  // GEMINI REQUEST
  // ============================================================

  try {
    const url =
      `https://generativelanguage.googleapis.com/v1beta/models/` +
      `${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: promptText,
              },
            ],
          },
        ],

        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1024,
          // thinkingConfig: {
          //   thinkingBudget: 0
          // }
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "[General Agent Gemini Error]",
        data?.error || data
      );

      return fallbackResponse();
    }

    const finishReason = data.candidates?.[0]?.finishReason;

    if (finishReason === "MAX_TOKENS") {
      console.warn("[General Agent] Response truncated due to maxOutputTokens.");
    }

    const replyText =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

    if (!replyText) {
      console.warn(
        "[General Agent] Gemini returned an empty response."
      );

      return fallbackResponse();
    }

    return replyText;
  } catch (error) {
    console.error(
      "[General Agent Exception]",
      error.message
    );

    return fallbackResponse();
  }
}

// ============================================================
// FALLBACK
// ============================================================

function fallbackResponse() {
  return `<b>How can I help?</b>

I can help you with:

• 🍽️ Menu and food information
• 🚚 Delivery information
• 💳 Payment methods
• 🕐 Opening hours
• 🪑 Table reservations
• 🛒 Orders`;
}

// ============================================================
// HTML ESCAPE
// ============================================================

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
