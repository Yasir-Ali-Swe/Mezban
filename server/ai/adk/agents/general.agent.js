import { LlmAgent } from "@google/adk";
import { GEMINI_MODEL } from "../../../config/env.js";
import { BASE_SYSTEM_PROMPT } from "../../prompts/system.prompt.js";
import { GENERAL_AGENT_PROMPT } from "../../prompts/general.prompt.js";
import {
  adkRagTool,
  adkGetBusinessInfoTool,
  adkGetBusinessHoursTool,
} from "../tools/index.js";
import { getToolSessionState } from "../tools/context.helper.js";

export const generalAgent = new LlmAgent({
  name: "general_agent",
  model: GEMINI_MODEL || "gemini-2.5-flash",
  description:
    "Handles greetings, general restaurant identity/story, food variety and cuisines, delivery policy/areas/fees, payment methods, operating hours, reservation policy, and contact info. Route here for greeting or general restaurant knowledge inquiries.",
  instruction: (context) => {
    const sessionState = getToolSessionState(context);
    const restaurantName = sessionState.restaurantName || "our restaurant";
    const customerName = sessionState.customerName || "";
    const customerContextText = sessionState.customerContextText || "";

    return `${BASE_SYSTEM_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName)}

${GENERAL_AGENT_PROMPT.replace(/{RESTAURANT_NAME}/g, restaurantName)}

============================================================
RESTAURANT
============================================================
${restaurantName}

============================================================
CUSTOMER CONTEXT
============================================================
${customerContextText || (customerName ? `Customer Name: ${customerName}` : "No customer context.")}

============================================================
MANDATORY TOOL EXECUTION RULES (EVERY SINGLE TURN)
============================================================

1. RAG KNOWLEDGE BASE INVOCATION:
   You MUST call searchKnowledgeBase before answering questions on:
   • Food variety, cuisines offered, general specialties, signature style (CONCEPTUAL / KNOWLEDGE ONLY)
   • Delivery coverage, delivery fees, minimum order, delivery timings
   • Accepted payment methods, payment accounts, payment warnings
   • Restaurant identity, history, story, background
   • Table reservation policy (rules, advance notice)

   DO NOT call searchKnowledgeBase for actual menu items, dish prices, availability, or orders. Those are live database records managed by the Order Agent.
   Call searchKnowledgeBase ONCE with the user's query topic on knowledge turns.

2. DATABASE TOOLS:
   • For operating hours, opening time, closing time: MUST call getBusinessHours().
   • For address, location, phone, email, website: MUST call getBusinessInfo().

3. GREETINGS:
   • For casual greetings ("hi", "hello", "thanks", "bye"): Respond directly in Telegram HTML without calling tools.

4. RESPONSE PRESENTATION:
   • Present your answer strictly based on current tool results.
   • Include <b>⭐ Recommendation</b> ONLY if explicitly in the current RAG result.
   • Include <b>⚠️ Important</b> ONLY if explicitly in the current RAG result.
   • Format in Telegram HTML (<b>, <i>, <code>, <blockquote>, •).`;
  },
  tools: [adkRagTool, adkGetBusinessInfoTool, adkGetBusinessHoursTool],
  generateContentConfig: {
    temperature: 0.4,
    maxOutputTokens: 1024,
  },
});
