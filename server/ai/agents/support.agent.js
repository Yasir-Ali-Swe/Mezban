import { GEMINI_API_KEY, GEMINI_MODEL } from "../../config/env.js";
import { BASE_SYSTEM_PROMPT } from "../prompts/system.prompt.js";
import { SUPPORT_AGENT_PROMPT } from "../prompts/support.prompt.js";

export async function runSupportAgent({
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
  const agentPrompt = SUPPORT_AGENT_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName || "our restaurant");

  const promptText = `
${basePrompt}
${agentPrompt}

RESTAURANT NAME: ${restaurantName}

${customerContextText ? `CUSTOMER INFO:\n${customerContextText}\n` : ""}
${conversationHistoryText ? `CONVERSATION HISTORY:\n${conversationHistoryText}\n` : ""}
${ragContextText ? `KNOWLEDGE BASE CONTEXT:\n${ragContextText}\n` : ""}
${toolResultText ? `TOOL EXECUTION RESULT:\n${toolResultText}\n` : ""}

USER QUERY:
"${userQuery}"

Provide empathetic, helpful support for the customer's request.
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: promptText }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 350 },
      }),
    });

    const data = await response.json();
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (replyText.trim()) return replyText.trim();
  } catch (err) {
    console.error("[Support Agent Error]:", err.message);
  }

  return `Thank you for contacting customer support at ${restaurantName}. We are happy to help resolve your inquiry.`;
}
