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

    // First interaction / new conversation
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

    // Existing conversation
    return `<b>Hi! 👋</b>
How can I help you today?`;
  }

  // ============================================================
  // GEMINI CONFIGURATION
  // ============================================================
  const modelName = GEMINI_MODEL || "gemini-1.5-flash";
  const apiKey = GEMINI_API_KEY;

  if (!apiKey) {
    console.error("[General Agent] GEMINI_API_KEY is missing.");
    return fallbackResponse(safeRestaurantName);
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

RESTAURANT NAME:
${safeRestaurantName}

CONVERSATION HISTORY:
${conversationHistoryText || "No previous conversation."}

CUSTOMER CONTEXT:
${customerContextText || "No additional customer context."}

KNOWLEDGE BASE CONTEXT:
${ragContextText || "No knowledge context was retrieved."}

TOOL EXECUTION RESULT:
${toolResultText || "No tool was executed."}

USER QUERY:
${userQuery}

CURRENT INTENT:
${intent || "BUSINESS_INFORMATION"}

==================================================
RESPONSE RULES
==================================================

1. Answer the user's question directly using ONLY the available knowledge context and tool result.

2. Never invent restaurant information.

3. If the knowledge context contains the answer, use it accurately.

4. Keep the response concise but useful.

5. Use Telegram HTML formatting.

6. Allowed Telegram HTML tags:
   <b>...</b>
   <strong>...</strong>
   <i>...</i>
   <em>...</em>
   <u>...</u>
   <s>...</s>
   <del>...</del>
   <code>...</code>
   <pre>...</pre>
   <a href="URL">...</a>
   <blockquote>...</blockquote>

7. Prefer <b>...</b> for:
   - headings
   - important information
   - prices
   - order numbers
   - reservation numbers

8. For lists, use the bullet character:
   • Item one
   • Item two
   • Item three

9. Use blank lines between sections.

10. For restaurant categories, structure information clearly.

Example:

<b>🍽️ Food Variety</b>

• <b>Pakistani Cuisine</b>
  Chicken Karahi, Biryani, Handi

• <b>BBQ</b>
  Chicken Tikka, Malai Boti, Seekh Kebab

• <b>Chinese</b>
  Chow Mein, Fried Rice, Manchurian

11. For payment information, structure it clearly.

Example:

<b>💳 Payment Methods</b>

• <b>Cash on Delivery</b> — Available for delivery orders.
• <b>Cash</b> — Available for dine-in and takeaway.
• <b>Online Payments</b> — Easypaisa, JazzCash, etc.
• <b>Card</b> — Available where supported.

12. For important recommendations, use:

<blockquote>🔥 <b>Chef's Recommendation</b>

Chicken Karahi is one of our popular choices.</blockquote>

13. Do NOT use Markdown.

14. Do NOT use MarkdownV2.

15. Do NOT use:
   #
   ##
   ###
   **
   *
   _
   __
   \`\`\`

16. Do NOT use Markdown tables.

17. Do NOT output JSON.

18. Do NOT output code blocks.

19. Do NOT start normal answers with:
   "Hello"
   "Hi"
   "Certainly"
   "Sure"
   "Absolutely"
   "Of course"
   "At ${safeRestaurantName}"

20. Do not repeatedly mention the restaurant name.

21. Do not repeatedly mention the customer's name.

22. Do not add unnecessary closing questions.

23. If the user asks a simple factual question, answer it directly.

24. If the user asks about food variety, organize the answer by cuisine/category.

25. If the user asks about payment methods, organize the answer by payment type.

26. If the user asks about delivery, clearly separate:
   - delivery areas
   - delivery fee
   - minimum order
   - estimated time

27. If the user asks about reservations, clearly separate:
   - availability
   - date/time
   - number of guests
   - reservation policy

28. Return ONLY the final customer-facing response.

Do not explain these rules.
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
          temperature: 0.2,
          maxOutputTokens: 350,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error(
        "[General Agent Gemini Error]",
        data?.error || data
      );

      return fallbackResponse(safeRestaurantName);
    }

    const replyText =
      data.candidates?.[0]?.content?.parts
        ?.map((part) => part.text || "")
        .join("")
        .trim() || "";

    if (!replyText) {
      console.warn("[General Agent] Gemini returned an empty response.");
      return fallbackResponse(safeRestaurantName);
    }

    return replyText;
  } catch (error) {
    console.error(
      "[General Agent Exception]",
      error.message
    );

    return fallbackResponse(safeRestaurantName);
  }
}

// ============================================================
// HELPERS
// ============================================================

function fallbackResponse(restaurantName) {
  return `<b>How can I help?</b>

I can help you with:

• 🍽️ Menu and food information
• 🚚 Delivery information
• 💳 Payment methods
• 🕐 Opening hours
• 🪑 Table reservations
• 🛒 Orders`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}