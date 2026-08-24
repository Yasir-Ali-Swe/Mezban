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
  const modelName = GEMINI_MODEL || "gemini-1.5-flash";
  const apiKey = GEMINI_API_KEY;

  const basePrompt = BASE_SYSTEM_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName || "our restaurant");
  const agentPrompt = ORDER_AGENT_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName || "our restaurant");

  const promptText = `
${basePrompt}
${agentPrompt}

RESTAURANT NAME: ${restaurantName}

${customerContextText ? `CUSTOMER INFO:\n${customerContextText}\n` : ""}
${conversationHistoryText ? `CONVERSATION HISTORY:\n${conversationHistoryText}\n` : ""}
${ragContextText ? `KNOWLEDGE BASE CONTEXT:\n${ragContextText}\n` : ""}
${toolResultText ? `TOOL EXECUTION RESULT (STRUCTURED ORDER/MENU DATA):\n${toolResultText}\n` : ""}

USER QUERY:
"${userQuery}"

State dish names, prices in Rs. (PKR), order totals, and status updates clearly to the customer.
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
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (replyText.trim()) return replyText.trim();
  } catch (err) {
    console.error("[Order Agent Error]:", err.message);
  }

  return `Thank you for your inquiry about our menu and orders at ${restaurantName}. How can I assist you with your order?`;
}
