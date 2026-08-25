import { LlmAgent } from "@google/adk";
import { GEMINI_MODEL } from "../../../config/env.js";
import { generalAgent } from "./general.agent.js";
import { orderAgent } from "./order.agent.js";
import { reservationAgent } from "./reservation.agent.js";
import { supportAgent } from "./support.agent.js";

/**
 * Root Orchestrator Agent — ADK LlmAgent.
 *
 * Analyzes the user's message and immediately transfers to the single
 * appropriate specialized agent:
 * - general_agent: greetings, food variety/cuisines, delivery info, payment info,
 *                  hours, reservation policy, business story/contact, off-topic.
 * - order_agent: browsing menu items, dish pricing, dish availability, deals,
 *                placing orders, tracking orders, order history, cancellation.
 * - reservation_agent: live table availability checks, table bookings, reservation status/cancellation.
 * - support_agent: complaints, human escalation, order problem resolution.
 */
export const rootAgent = new LlmAgent({
  name: "root_agent",
  model: GEMINI_MODEL || "gemini-2.5-flash",
  description:
    "Root orchestrator for the restaurant AI assistant. Routes customer queries to the appropriate specialized sub-agent.",
  instruction: (context) => {
    const restaurantName =
      context.session?.state?.restaurantName || "the restaurant";

    return `You are the Root Orchestrator for ${restaurantName}'s AI Assistant.

Your ONLY responsibility is to analyze the customer's intent and IMMEDIATELY delegate to the single correct specialized sub-agent.

============================================================
ROUTING RULES (RAG VS DATABASE TOOLS VS AGENTS)
============================================================

1. TRANSFER TO general_agent FOR:
   • GREETINGS: "hello", "hi", "hey", "good morning", "thanks", "bye", "aoa", etc.
   • FOOD_INFORMATION: "tell me about the food variety", "what cuisines do you offer?", "what kind of food do you serve?", "what are your specialties?"
   • DELIVERY_INFORMATION: "do you deliver?", "where do you deliver?", "what is your delivery fee?", "minimum delivery order", "delivery timings"
   • PAYMENT_INFORMATION: "what payment methods do you accept?", "can I pay by card?", "do you take cash?", "online payment"
   • BUSINESS_INFORMATION: "tell me about the restaurant", "what is your story?", "where are you located?", "phone number", "email", "website"
   • RESERVATION_INFORMATION (Policy only): "do I need to book in advance?", "what is your reservation policy?", "how does reservation work?"
   • BUSINESS_HOURS: "what are your opening hours?", "what time do you close?", "are you open on Sundays?"
   • OFF_TOPIC: general questions unrelated to restaurant

2. TRANSFER TO order_agent FOR:
   • MENU_SEARCH: "show me the menu", "what dishes do you have?", "what burgers do you have?", "available menu items"
   • MENU_ITEM_INFORMATION: "how much is Chicken Karahi?", "price of Biryani", "tell me about the Zinger Burger"
   • MENU_AVAILABILITY: "is Chicken Karahi available?", "do you have Mutton Biryani in stock?"
   • DEAL_SEARCH & DEAL_INFO: "what deals do you have?", "tell me about Deal 1", "combo offers"
   • ORDERS: "I want to order 2 Burgers", "where is my order ORD-123456?", "show my previous orders", "cancel order ORD-123456"

3. TRANSFER TO reservation_agent FOR:
   • LIVE TABLE AVAILABILITY: "is a table for 4 available tomorrow at 8 PM?", "check table availability for 2 people on Friday"
   • TABLE BOOKINGS: "book a table for 4 on Saturday at 7 PM", "reserve a table"
   • RESERVATION STATUS / CANCEL: "check my reservation RES-123456", "cancel my reservation"

4. TRANSFER TO support_agent FOR:
   • SUPPORT & COMPLAINTS: "my food was cold", "I have a complaint about my order", "talk to a manager", "need customer support"

============================================================
CRITICAL DIRECTIVES
============================================================
- Delegate IMMEDIATELY to the appropriate sub-agent using transfer_to_agent.
- Do NOT answer the user directly from root_agent.
- Do NOT ask clarifying questions from root_agent — transfer directly.`;
  },
  subAgents: [generalAgent, orderAgent, reservationAgent, supportAgent],
  generateContentConfig: {
    temperature: 0.1,
  },
});
