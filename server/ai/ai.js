import prisma from "../config/prisma.js";
import { getConversationMemory } from "./memory/memory.manager.js";
import { formatAiResponse } from "./response/formatter.js";
import { runAdkMessage, mapAgentNameToType } from "./adk/runner.js";
import {
  initTrace,
  setQuery,
  setTelegramOutput,
  recordError,
  printAndClear,
} from "./utils/request.tracer.js";

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

  // 3. ADK PIPELINE — run the full agent execution through root & specialized agents
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
    console.error("[ADK Pipeline Error]:", adkErr?.message || adkErr);
    rawReply = `I can help you with our menu, orders, reservations, delivery, or operating hours. How can I assist you at ${restaurantName}?`;
    agentName = "general_agent";
  }

  const llmTimeMs = Date.now() - t0;

  // 4. Fallback if ADK returned empty
  if (!rawReply || !rawReply.trim()) {
    rawReply = `I can help you with our menu, orders, reservations, delivery, or operating hours. How can I assist you at ${restaurantName}?`;
  }

  // 5. Response Formatting & Sanitization
  const isGreetingQuery =
    /^(hi|hello|hey|good\s*(morning|afternoon|evening)|aoa|salam|assalam|slm|greetings|thanks|thank you|bye)/i.test(
      messageText.trim()
    );

  const finalReplyText = formatAiResponse(rawReply, {
    customerName: memory.customerProfile?.customerName,
    restaurantName,
    isGreeting: isGreetingQuery,
  });

  const totalTimeMs = Date.now() - startTime;

  // 6. Record final Telegram output and print trace
  setTelegramOutput(traceId, finalReplyText);
  const traceResult = printAndClear(traceId) || {};

  const finalIntent = traceResult.intent || "GENERAL_QUERY";
  const selectedAgentType = mapAgentNameToType(traceResult.agent || agentName);

  // 7. Async Prisma persistence with ToolExecution tracking
  (async () => {
    try {
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
          toolExecutions:
            toolRecords.length > 0
              ? {
                create: toolRecords,
              }
              : undefined,
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
