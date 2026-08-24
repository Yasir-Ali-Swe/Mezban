import { GEMINI_API_KEY, GEMINI_MODEL } from "../../config/env.js";
import { ORCHESTRATOR_PROMPT } from "../prompts/orchestrator.prompt.js";

/**
 * Fast-path rule check for quick greetings & simple phrases (0ms LLM latency)
 */
function fastPathCheck(query, isNewConversation = false) {
  const clean = query.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");

  const GREETING_WORDS = ["hello", "hi", "hey", "good morning", "good afternoon", "good evening", "/start", "assalam o alaikum", "aoa", "slm"];
  const CLOSING_WORDS = ["thanks", "thank you", "bye", "goodbye", "ok", "okay"];

  if (GREETING_WORDS.includes(clean)) {
    return {
      query,
      intent: "GREETING",
      agent: "GENERAL_AGENT",
      capability: "NEITHER",
      ragRequired: false,
      toolRequired: false,
      toolName: null,
      toolArgs: {},
      isNewConversation,
    };
  }

  if (CLOSING_WORDS.includes(clean)) {
    return {
      query,
      intent: "GREETING",
      agent: "GENERAL_AGENT",
      capability: "NEITHER",
      ragRequired: false,
      toolRequired: false,
      toolName: null,
      toolArgs: {},
      isNewConversation: false,
    };
  }

  return null;
}

/**
 * Orchestrator Agent: Analyzes user query, classifies intent, selects agent, and determines required capability (RAG/Tool)
 */
export async function runOrchestrator({ userQuery, restaurantName, conversationHistoryText, customerContextText, isNewConversation = false }) {
  // 1. Check fast-path for simple greetings (0ms latency boost!)
  const fastResult = fastPathCheck(userQuery, isNewConversation);
  if (fastResult) return fastResult;

  const modelName = GEMINI_MODEL || "gemini-1.5-flash";
  const apiKey = GEMINI_API_KEY;

  const systemInstruction = ORCHESTRATOR_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName || "the Restaurant");

  const promptText = `
${systemInstruction}

CUSTOMER CONTEXT:
${customerContextText || "No context."}

CONVERSATION HISTORY:
${conversationHistoryText || "No history."}

CURRENT USER QUERY:
"${userQuery}"
`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.1,
        },
      }),
    });

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    if (!rawText) {
      return fallbackOrchestration(userQuery);
    }

    const parsed = JSON.parse(rawText);
    const cap = parsed.capability || (parsed.ragRequired ? "RAG" : parsed.toolRequired ? "TOOL" : "NEITHER");

    return {
      query: userQuery,
      intent: parsed.intent || "BUSINESS_INFORMATION",
      agent: parsed.agent || "GENERAL_AGENT",
      capability: cap,
      ragRequired: cap === "RAG" || cap === "BOTH",
      toolRequired: cap === "TOOL" || cap === "BOTH",
      toolName: parsed.toolName && parsed.toolName !== "NONE" ? parsed.toolName : null,
      toolArgs: parsed.toolArgs || {},
    };
  } catch (err) {
    console.warn("[Orchestrator Warning] Falling back to rule classification:", err.message);
    return fallbackOrchestration(userQuery);
  }
}

function fallbackOrchestration(query) {
  const lower = query.toLowerCase();

  if (lower.includes("order") || lower.includes("buy") || lower.includes("burger") || lower.includes("pizza") || lower.includes("food") || lower.includes("dish") || lower.includes("menu")) {
    if (lower.includes("cancel")) {
      return { query, intent: "CANCEL_ORDER", agent: "ORDER_AGENT", capability: "TOOL", ragRequired: false, toolRequired: true, toolName: "cancelOrder", toolArgs: {} };
    }
    if (lower.includes("my previous") || lower.includes("last order") || lower.includes("order history")) {
      return { query, intent: "CUSTOMER_ORDERS", agent: "ORDER_AGENT", capability: "TOOL", ragRequired: false, toolRequired: true, toolName: "getCustomerOrders", toolArgs: {} };
    }
    if (lower.includes("how much") || lower.includes("price") || lower.includes("cost")) {
      return { query, intent: "MENU_ITEM_INFORMATION", agent: "ORDER_AGENT", capability: "TOOL", ragRequired: false, toolRequired: true, toolName: "searchMenu", toolArgs: { query } };
    }
    return { query, intent: "MENU_SEARCH", agent: "ORDER_AGENT", capability: "TOOL", ragRequired: false, toolRequired: true, toolName: "searchMenu", toolArgs: { query } };
  }

  if (lower.includes("reserve") || lower.includes("table") || lower.includes("booking") || lower.includes("guests")) {
    if (lower.includes("cancel")) {
      return { query, intent: "CANCEL_RESERVATION", agent: "RESERVATION_AGENT", capability: "TOOL", ragRequired: false, toolRequired: true, toolName: "cancelReservation", toolArgs: {} };
    }
    return { query, intent: "CREATE_RESERVATION", agent: "RESERVATION_AGENT", capability: "TOOL", ragRequired: false, toolRequired: true, toolName: "checkAvailability", toolArgs: {} };
  }

  if (lower.includes("deliver")) {
    return { query, intent: "DELIVERY_INFORMATION", agent: "GENERAL_AGENT", capability: "RAG", ragRequired: true, toolRequired: false, toolName: null, toolArgs: {} };
  }

  if (lower.includes("pay") || lower.includes("payment") || lower.includes("card") || lower.includes("cash")) {
    return { query, intent: "PAYMENT_INFORMATION", agent: "GENERAL_AGENT", capability: "RAG", ragRequired: true, toolRequired: false, toolName: null, toolArgs: {} };
  }

  if (lower.includes("time") || lower.includes("open") || lower.includes("hour") || lower.includes("close")) {
    return { query, intent: "BUSINESS_HOURS", agent: "GENERAL_AGENT", capability: "TOOL", ragRequired: false, toolRequired: true, toolName: "getBusinessHours", toolArgs: {} };
  }

  return { query, intent: "BUSINESS_INFORMATION", agent: "GENERAL_AGENT", capability: "RAG", ragRequired: true, toolRequired: false, toolName: null, toolArgs: {} };
}
