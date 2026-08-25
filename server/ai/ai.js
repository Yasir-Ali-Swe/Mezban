import prisma from "../config/prisma.js";
import { getConversationMemory } from "./memory/memory.manager.js";
import { formatAiResponse } from "./response/formatter.js";
import { runAdkMessage, mapAgentNameToType } from "./adk/runner.js";
import {
  initTrace,
  setQuery,
  setAgentRouting,
  setTelegramOutput,
  setRawLlmResponse,
  recordError,
  printAndClear,
} from "./utils/request.tracer.js";

// ============================================================
// GREETING FAST-PATH (preserved from original orchestrator)
// Returns true if the query is a simple greeting/closing that
// should receive an immediate hardcoded response without an LLM call.
// ============================================================

const GREETING_WORDS = new Set([
  "hello", "hi", "hey",
  "good morning", "good afternoon", "good evening",
  "/start",
  "assalam o alaikum", "aoa", "slm",
]);

const CLOSING_WORDS = new Set([
  "thanks", "thank you", "bye", "goodbye", "ok", "okay",
]);

function isSimpleGreeting(query) {
  const clean = query.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  return GREETING_WORDS.has(clean) || CLOSING_WORDS.has(clean);
}

function buildGreetingResponse(restaurantName, isNewConversation, conversationHistoryText, isClosing) {
  if (isClosing) {
    return `<b>You're welcome!</b> 😊\n\nFeel free to reach out anytime. Is there anything else I can help you with?`;
  }

  const hasHistory =
    typeof conversationHistoryText === "string" &&
    conversationHistoryText.trim().length > 0;

  if (isNewConversation || !hasHistory) {
    const safeName = escapeHtml(restaurantName || "our restaurant");
    return `<b>Hello! 👋</b>

I'm the AI assistant for <b>${safeName}</b>.

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

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ============================================================
// MAIN AI PIPELINE ENTRY POINT
// ============================================================

/**
 * Processes a customer Telegram message through the Google ADK pipeline.
 *
 * Full request trace is printed to the terminal for every request, showing:
 *   - User query
 *   - Agent routing / intent
 *   - RAG chunks retrieved (if RAG was used)
 *   - Tool calls and their results (if tools were used)
 *   - LLM context assembled
 *   - Raw LLM response
 *   - Final output sent to Telegram
 *   - Any errors (API key, quota, network, etc.)
 *
 * @param {{ businessId: string, conversationId: string, customerId: string, messageText: string }}
 * @returns {Promise<{ replyText: string, intent: string, agent: string, executionTimeMs: number }>}
 */
export async function processMessageWithAi({ businessId, conversationId, customerId, messageText }) {
  const startTime = Date.now();

  if (!businessId || !conversationId || !messageText) {
    throw new Error("businessId, conversationId, and messageText are required for AI processing");
  }

  // ── Init request trace
  const traceId = `${conversationId}_${startTime}`;
  initTrace(traceId);
  setQuery(traceId, messageText);

  // 1. Fetch Business name
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  const restaurantName = business?.name || "our restaurant";

  // 2. Load short-term conversation history and long-term customer context
  const memory = await getConversationMemory({ conversationId, customerId, businessId });
  const isNewConversation = !memory.messages || memory.messages.length <= 1;

  // 3. GREETING FAST-PATH — return immediately for simple greetings (0ms LLM latency)
  const clean = messageText.trim().toLowerCase().replace(/[^a-z0-9\s]/g, "");
  const isClosing = CLOSING_WORDS.has(clean);

  if (isSimpleGreeting(messageText)) {
    setAgentRouting(traceId, {
      agentName: "GENERAL_AGENT",
      agentType: "GENERAL_AGENT",
      intent: "GREETING",
      capability: "NEITHER",
      fastPath: true,
    });

    const greetingReply = buildGreetingResponse(
      restaurantName,
      isNewConversation,
      memory.conversationHistoryText,
      isClosing
    );

    const finalReplyText = formatAiResponse(greetingReply, {
      customerName: memory.customerProfile?.customerName,
      restaurantName,
      isGreeting: true,
    });

    // Record fast-path response
    setRawLlmResponse(traceId, `[FAST-PATH] ${greetingReply}`);
    setTelegramOutput(traceId, finalReplyText);
    printAndClear(traceId);

    const totalTimeMs = Date.now() - startTime;

    // Async Prisma logging (fire-and-forget)
    (async () => {
      try {
        await prisma.agentRun.create({
          data: {
            businessId,
            conversationId,
            agent: "GENERAL_AGENT",
            userMessage: messageText,
            finalResponse: finalReplyText,
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { intent: "GREETING", agent: "GENERAL_AGENT" },
        });
      } catch (dbErr) {
        console.warn("[AI DB Logging Warning]:", dbErr.message);
      }
    })();

    return {
      replyText: finalReplyText,
      intent: "GREETING",
      agent: "GENERAL_AGENT",
      executionTimeMs: totalTimeMs,
      timings: { intentTimeMs: 0, embeddingTimeMs: 0, vectorSearchTimeMs: 0, toolTimeMs: 0, llmTimeMs: 0 },
    };
  }

  // 4. ADK PIPELINE — run the full agent execution
  const t0 = Date.now();
  let rawReply = "";
  let agentName = "general_agent";
  let executedToolCalls = [];

  try {
    const result = await runAdkMessage({
      businessId,
      customerId,
      conversationId,
      restaurantName,
      customerName: memory.customerProfile?.customerName || "",
      customerContextText: memory.customerContextText,
      recentMessages: memory.messages,
      messageText,
      traceId,
    });
    rawReply = result.rawReply;
    agentName = result.agentName;
    executedToolCalls = result.executedToolCalls || [];
  } catch (adkErr) {
    recordError(traceId, adkErr);
    rawReply = `I can help you with our menu, orders, reservations, delivery, or operating hours. How can I assist you at ${restaurantName}?`;
    agentName = "general_agent";
  }

  const llmTimeMs = Date.now() - t0;

  // 5. Fallback if ADK returned empty
  if (!rawReply || !rawReply.trim()) {
    rawReply = `I can help you with our menu, orders, reservations, delivery, or operating hours. How can I assist you at ${restaurantName}?`;
  }

  // 6. Response Formatting & Sanitization (unchanged)
  const finalReplyText = formatAiResponse(rawReply, {
    customerName: memory.customerProfile?.customerName,
    restaurantName,
    isGreeting: false,
  });

  const totalTimeMs = Date.now() - startTime;

  // 7. Record final Telegram output and print trace
  setTelegramOutput(traceId, finalReplyText);
  const traceResult = printAndClear(traceId) || {};

  const finalIntent = traceResult.intent || "GENERAL_QUERY";
  const selectedAgentType = mapAgentNameToType(traceResult.agent || agentName);

  // 8. Async Prisma persistence with ToolExecution tracking
  (async () => {
    try {
      // Filter out internal transfer_to_agent from database ToolExecution records if desired,
      // or record all tools with sanitized input/output
      const toolRecords = executedToolCalls
        .filter((t) => t.name !== "transfer_to_agent")
        .map((t) => ({
          toolName: t.name,
          input: t.args || {},
          output: t.result ? (typeof t.result === "object" ? t.result : { text: String(t.result) }) : {},
          status: "COMPLETED",
          startedAt: new Date(Date.now() - (t.timeMs || 0)),
          completedAt: new Date(),
        }));

      await prisma.agentRun.create({
        data: {
          businessId,
          conversationId,
          agent: selectedAgentType,
          userMessage: messageText,
          finalResponse: finalReplyText,
          status: "COMPLETED",
          completedAt: new Date(),
          toolExecutions: toolRecords.length > 0 ? {
            create: toolRecords,
          } : undefined,
        },
      });

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          intent: finalIntent,
          agent: selectedAgentType,
        },
      });
    } catch (dbErr) {
      console.warn("[AI DB Logging Warning]:", dbErr.message);
    }
  })();

  return {
    replyText: finalReplyText,
    intent: finalIntent,
    agent: selectedAgentType,
    executionTimeMs: totalTimeMs,
    timings: {
      intentTimeMs: 0,
      embeddingTimeMs: 0,
      vectorSearchTimeMs: 0,
      toolTimeMs: 0,
      llmTimeMs,
    },
  };
}
