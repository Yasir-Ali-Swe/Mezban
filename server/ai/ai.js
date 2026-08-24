import prisma from "../config/prisma.js";
import { getConversationMemory } from "./memory/memory.manager.js";
import { runOrchestrator } from "./agents/orchestrator.js";
import { retrieveKnowledge } from "./rag/index.js";
import { logAiDiagnostic } from "./utils/ai.logger.js";
import { formatAiResponse } from "./response/formatter.js";

// Agents
import { runGeneralAgent } from "./agents/general.agent.js";
import { runOrderAgent } from "./agents/order.agent.js";
import { runReservationAgent } from "./agents/reservation.agent.js";
import { runSupportAgent } from "./agents/support.agent.js";

// Tools Registry
import { getBusinessInfoTool } from "./tools/business/getBusinessInfo.tool.js";
import { getBusinessHoursTool } from "./tools/business/getBusinessHours.tool.js";
import { getCustomerTool } from "./tools/customer/getCustomer.tool.js";
import { createCustomerTool } from "./tools/customer/createCustomer.tool.js";
import { searchDealsTool } from "./tools/deals/searchDeals.tool.js";
import { getDealTool } from "./tools/deals/getDeal.tool.js";
import { searchMenuTool } from "./tools/menu/searchMenu.tool.js";
import { getMenuItemTool } from "./tools/menu/getMenuItem.tool.js";
import { checkMenuAvailabilityTool } from "./tools/menu/checkMenuAvailability.tool.js";
import { createOrderTool } from "./tools/orders/createOrder.tool.js";
import { getOrderTool } from "./tools/orders/getOrder.tool.js";
import { getCustomerOrdersTool } from "./tools/orders/getCustomerOrders.tool.js";
import { cancelOrderTool } from "./tools/orders/cancelOrder.tool.js";
import { checkAvailabilityTool } from "./tools/reservations/checkAvailability.tool.js";
import { createReservationTool } from "./tools/reservations/createReservation.tool.js";
import { getReservationTool } from "./tools/reservations/getReservation.tool.js";
import { cancelReservationTool } from "./tools/reservations/cancelReservation.tool.js";

const toolRegistry = {
  getBusinessInfo: getBusinessInfoTool,
  getBusinessHours: getBusinessHoursTool,
  getCustomer: getCustomerTool,
  createCustomer: createCustomerTool,
  searchDeals: searchDealsTool,
  getDeal: getDealTool,
  searchMenu: searchMenuTool,
  getMenuItem: getMenuItemTool,
  checkMenuAvailability: checkMenuAvailabilityTool,
  createOrder: createOrderTool,
  getOrder: getOrderTool,
  getCustomerOrders: getCustomerOrdersTool,
  cancelOrder: cancelOrderTool,
  checkAvailability: checkAvailabilityTool,
  createReservation: createReservationTool,
  getReservation: getReservationTool,
  cancelReservation: cancelReservationTool,
};

/**
 * Main AI Pipeline Entry Point
 */
export async function processMessageWithAi({ businessId, conversationId, customerId, messageText }) {
  const startTime = Date.now();

  if (!businessId || !conversationId || !messageText) {
    throw new Error("businessId, conversationId, and messageText are required for AI processing");
  }

  // 1. Fetch Business Profile for authentic restaurant name
  const business = await prisma.business.findUnique({
    where: { id: businessId },
  });
  const restaurantName = business?.name || "our restaurant";

  // 2. Load Short-term conversation history and Long-term customer context
  const memory = await getConversationMemory({ conversationId, customerId, businessId });
  const isNewConversation = !memory.messages || memory.messages.length <= 1;

  // 3. Orchestration & Intent Classification
  const t0 = Date.now();
  const orchestration = await runOrchestrator({
    userQuery: messageText,
    restaurantName,
    conversationHistoryText: memory.conversationHistoryText,
    customerContextText: memory.customerContextText,
    isNewConversation,
  });
  const intentTimeMs = Date.now() - t0;

  // 4. Capability Execution (RAG / Tool / Both / Neither)
  let ragResult = { chunks: [], contextText: "", chunkCount: 0, primaryDocumentType: null, embeddingTimeMs: 0, vectorSearchTimeMs: 0 };
  let ragTimeMs = 0;
  if (orchestration.ragRequired) {
    const t1 = Date.now();
    ragResult = await retrieveKnowledge(messageText, businessId, { topK: 4, threshold: 0.25 });
    ragTimeMs = Date.now() - t1;
  }

  let toolResult = null;
  let toolInputData = null;
  let toolTimeMs = 0;
  if (orchestration.toolRequired && orchestration.toolName && toolRegistry[orchestration.toolName]) {
    const t2 = Date.now();
    const toolObj = toolRegistry[orchestration.toolName];
    toolInputData = {
      businessId,
      customerId,
      ...(orchestration.toolArgs || {}),
    };
    try {
      toolResult = await toolObj.execute(toolInputData);
    } catch (toolErr) {
      console.error(`[Tool Execution Error] ${orchestration.toolName}:`, toolErr.message);
      toolResult = { error: toolErr.message };
    }
    toolTimeMs = Date.now() - t2;
  }

  const toolResultText = toolResult ? JSON.stringify(toolResult, null, 2) : "";

  // 5. Agent Execution
  let rawReply = "";
  const t3 = Date.now();
  if (orchestration.ragRequired && ragResult.chunkCount === 0 && !toolResult) {
    if (orchestration.intent === "OFF_TOPIC") {
      rawReply = `I'm here to help with ${restaurantName}'s menu, orders, reservations, delivery, and restaurant information. What can I help you with?`;
    } else {
      rawReply = `I can help you with our menu, orders, reservations, delivery, or operating hours. How can I assist you at ${restaurantName}?`;
    }
  } else {
    const agentPayload = {
      userQuery: messageText,
      restaurantName,
      conversationHistoryText: memory.conversationHistoryText,
      customerContextText: memory.customerContextText,
      ragContextText: ragResult.contextText,
      toolResultText,
      intent: orchestration.intent,
      isNewConversation,
    };

    switch (orchestration.agent) {
      case "ORDER_AGENT":
        rawReply = await runOrderAgent(agentPayload);
        break;
      case "RESERVATION_AGENT":
        rawReply = await runReservationAgent(agentPayload);
        break;
      case "SUPPORT_AGENT":
        rawReply = await runSupportAgent(agentPayload);
        break;
      case "GENERAL_AGENT":
      default:
        rawReply = await runGeneralAgent(agentPayload);
        break;
    }
  }
  const llmTimeMs = Date.now() - t3;

  // 6. Response Formatting & Sanitization
  const finalReplyText = formatAiResponse(rawReply, {
    customerName: memory.customerProfile?.customerName,
    restaurantName,
    isGreeting: orchestration.intent === "GREETING",
  });

  const totalTimeMs = Date.now() - startTime;

  // 7. Terminal Diagnostic Output Block
  logAiDiagnostic({
    userQuery: messageText,
    intent: orchestration.intent,
    selectedAgent: orchestration.agent,
    capability: orchestration.capability,
    ragUsed: orchestration.ragRequired && ragResult.chunkCount > 0,
    ragDocument: ragResult.primaryDocumentType,
    retrievedChunksCount: ragResult.chunkCount,
    toolName: orchestration.toolName || "none",
    toolInput: toolInputData,
    toolResult,
    finalResponse: finalReplyText,
    executionTimeMs: totalTimeMs,
    timings: {
      intentTimeMs,
      embeddingTimeMs: ragResult.embeddingTimeMs || 0,
      vectorSearchTimeMs: ragResult.vectorSearchTimeMs || 0,
      toolTimeMs,
      llmTimeMs,
    },
    businessId,
    conversationId,
  });

  // 8. Record AgentRun and ToolExecution in Prisma asynchronously
  (async () => {
    try {
      const agentRun = await prisma.agentRun.create({
        data: {
          businessId,
          conversationId,
          agent: orchestration.agent,
          userMessage: messageText,
          finalResponse: finalReplyText,
          status: "COMPLETED",
          completedAt: new Date(),
        },
      });

      if (orchestration.toolName && orchestration.toolName !== "NONE") {
        await prisma.toolExecution.create({
          data: {
            agentRunId: agentRun.id,
            toolName: orchestration.toolName,
            input: toolInputData || {},
            output: toolResult || {},
            status: "COMPLETED",
            completedAt: new Date(),
          },
        });
      }

      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          intent: orchestration.intent,
          agent: orchestration.agent,
        },
      });
    } catch (dbErr) {
      console.warn("[AI DB Logging Warning]:", dbErr.message);
    }
  })();

  return {
    replyText: finalReplyText,
    intent: orchestration.intent,
    agent: orchestration.agent,
    executionTimeMs: totalTimeMs,
    timings: {
      intentTimeMs,
      embeddingTimeMs: ragResult.embeddingTimeMs || 0,
      vectorSearchTimeMs: ragResult.vectorSearchTimeMs || 0,
      toolTimeMs,
      llmTimeMs,
    },
  };
}
