import { Runner, InMemorySessionService } from "@google/adk";
import { rootAgent } from "./agents/root.agent.js";
import {
  recordToolCall,
  setAgentRouting,
  setLlmContext,
  setRawLlmResponse,
  recordError,
} from "../utils/request.tracer.js";

/**
 * TeleAgent ADK Runner
 *
 * Singleton pattern: one Runner and one InMemorySessionService per process.
 * Sessions are keyed by: userId = `${businessId}::${customerId}`, sessionId = conversationId
 *
 * Session state carries runtime context:
 *   { businessId, customerId, restaurantName, customerName, customerContextText, traceId }
 *
 * PostgreSQL/Prisma remains the source of truth for persistent data.
 * ADK session holds the in-context conversation turn history for the LLM.
 */

const APP_NAME = "teleagent";

// Singleton session service — persists across all requests in this process
const sessionService = new InMemorySessionService();

// Singleton runner — shared across all Telegram messages
export const adkRunner = new Runner({
  appName: APP_NAME,
  agent: rootAgent,
  sessionService,
});

/**
 * Derives the stable ADK userId from businessId + customerId.
 * This ensures sessions are isolated per business and per customer.
 */
function buildUserId(businessId, customerId) {
  return `${businessId}::${customerId}`;
}

/**
 * Gets the existing ADK session for this conversation, or creates a new one.
 *
 * On first creation, seeds the session with:
 *   - State: businessId, customerId, restaurantName, customerName, customerContextText, traceId
 *   - History: recent Prisma messages (last 10) as ADK Content events
 */
export async function getOrCreateAdkSession({
  businessId,
  customerId,
  conversationId,
  restaurantName,
  customerName,
  customerContextText,
  recentMessages = [],
  traceId,
}) {
  const userId = buildUserId(businessId, customerId);
  const sessionId = conversationId;

  // Try to get an existing session first
  const existing = await sessionService.getSession({
    appName: APP_NAME,
    userId,
    sessionId,
  });

  if (existing) {
    // Update traceId and conversationId in state for this request
    existing.state.traceId = traceId;
    existing.state.conversationId = conversationId;
    return existing;
  }

  // Build initial state for the new session
  const initialState = {
    businessId,
    customerId,
    conversationId,
    restaurantName: restaurantName || "our restaurant",
    customerName: customerName || "",
    customerContextText: customerContextText || "",
    traceId: traceId || "",
  };

  // Seed session with recent Prisma history
  const historyContents = [];
  for (const msg of recentMessages) {
    const role = msg.sender === "CUSTOMER" ? "user" : "model";
    historyContents.push({
      role,
      parts: [{ text: msg.content || "" }],
    });
  }

  // Create a new session with seeded state
  const session = await sessionService.createSession({
    appName: APP_NAME,
    userId,
    sessionId,
    state: initialState,
  });

  // Seed history events (best-effort)
  for (const content of historyContents) {
    try {
      await sessionService.appendEvent({
        session,
        event: {
          author: content.role === "user" ? "user" : rootAgent.name,
          content,
          id: `seed_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          timestamp: Date.now() / 1000,
          partial: false,
        },
      });
    } catch {
      // Seeding is best-effort; ignore individual event errors
    }
  }

  return session;
}

/**
 * Runs the ADK pipeline for a single customer message.
 */
export async function runAdkMessage({
  businessId,
  customerId,
  conversationId,
  restaurantName,
  customerName,
  customerContextText,
  recentMessages,
  messageText,
  traceId,
}) {
  // Ensure session exists (create or retrieve)
  await getOrCreateAdkSession({
    businessId,
    customerId,
    conversationId,
    restaurantName,
    customerName,
    customerContextText,
    recentMessages,
    traceId,
  });

  const userId = buildUserId(businessId, customerId);
  const sessionId = conversationId;

  const newMessage = {
    role: "user",
    parts: [{ text: messageText }],
  };

  let rawReply = "";
  let agentName = "general_agent";
  const executedToolCalls = [];

  // Track tool timing
  const toolStartTimes = new Map();

  try {
    for await (const event of adkRunner.runAsync({
      userId,
      sessionId,
      newMessage,
    })) {
      if (!event || !event.content) continue;

      const author = event.author || "";
      const parts = event.content?.parts || [];

      for (const part of parts) {
        // Tool invocation (model requesting a tool call)
        if (part.functionCall) {
          const toolName = part.functionCall.name || "unknown_tool";
          const toolArgs = part.functionCall.args || {};
          const callId = part.functionCall.id || toolName;
          toolStartTimes.set(callId, Date.now());
          toolStartTimes.set(`args_${callId}`, toolArgs);
          toolStartTimes.set(`name_${callId}`, toolName);
        }

        // Tool result (tool execution completed)
        if (part.functionResponse) {
          const toolName = part.functionResponse.name || "unknown_tool";
          const result = part.functionResponse.response;
          const callId = part.functionResponse.id || toolName;

          const startMs = toolStartTimes.get(callId);
          const timeMs = startMs ? Date.now() - startMs : 0;
          const storedArgs = toolStartTimes.get(`args_${callId}`) || {};
          const storedName = toolStartTimes.get(`name_${callId}`) || toolName;

          const toolRecord = {
            name: storedName,
            args: storedArgs,
            result,
            timeMs,
          };

          executedToolCalls.push(toolRecord);

          // Record to tracer
          if (traceId) {
            recordToolCall(traceId, toolRecord);
          }
        }

        // Model text response
        if (part.text && typeof part.text === "string" && !event.partial) {
          const text = part.text.trim();
          if (text) {
            rawReply = text;
            if (author && author !== "user" && author !== rootAgent.name) {
              agentName = author;
            } else if (author && author !== "user") {
              agentName = author;
            }

            if (traceId) {
              setRawLlmResponse(traceId, text);
            }
          }
        }
      }

      // Determine agent routing from event author
      if (author && author !== "user" && author !== rootAgent.name && !event.partial) {
        if (traceId) {
          setAgentRouting(traceId, {
            agentName: author,
            agentType: mapAgentNameToType(author),
            fastPath: false,
          });
        }
      }
    }
  } catch (err) {
    if (traceId) {
      recordError(traceId, err);
    }
    throw err;
  }

  // Build LLM context summary for the tracer
  if (traceId) {
    const contextSummary = buildContextSummary({
      restaurantName,
      customerContextText,
      recentMessages,
      messageText,
    });
    setLlmContext(traceId, contextSummary);
  }

  return { rawReply, agentName, executedToolCalls };
}

/**
 * Builds a human-readable summary of the context sent to the LLM.
 */
function buildContextSummary({ restaurantName, customerContextText, recentMessages, messageText }) {
  const lines = [];

  lines.push(`[System Context]`);
  lines.push(`  Restaurant: ${restaurantName}`);

  if (customerContextText) {
    lines.push(`\n[Customer Context]`);
    customerContextText.split("\n").forEach((l) => lines.push(`  ${l}`));
  }

  if (recentMessages && recentMessages.length > 0) {
    lines.push(`\n[Conversation History — last ${recentMessages.length} messages]`);
    recentMessages.forEach((msg) => {
      const role = msg.sender === "CUSTOMER" ? "User" : "Assistant";
      const text = (msg.content || "").substring(0, 150);
      lines.push(`  ${role}: ${text}${msg.content?.length > 150 ? "..." : ""}`);
    });
  }

  lines.push(`\n[Current User Message]`);
  lines.push(`  ${messageText}`);

  return lines.join("\n");
}

/**
 * Maps ADK agent name to the legacy agent type string
 * used in Prisma AgentRun records and conversation.agent field.
 */
export function mapAgentNameToType(agentName) {
  if (!agentName) return "GENERAL_AGENT";
  const normalized = String(agentName).toLowerCase();
  const map = {
    general_agent: "GENERAL_AGENT",
    order_agent: "ORDER_AGENT",
    reservation_agent: "RESERVATION_AGENT",
    support_agent: "SUPPORT_AGENT",
    root_agent: "GENERAL_AGENT",
  };
  return (
    map[normalized] ||
    (["GENERAL_AGENT", "ORDER_AGENT", "RESERVATION_AGENT", "SUPPORT_AGENT"].includes(agentName)
      ? agentName
      : "GENERAL_AGENT")
  );
}
