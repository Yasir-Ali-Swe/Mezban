import { FunctionTool } from "@google/adk";
import { escalateConversationTool } from "../../tools/support/escalateConversation.tool.js";
import { getToolSessionState } from "./context.helper.js";

/**
 * ADK FunctionTool wrapper: escalateConversation
 */
export const adkEscalateConversationTool = new FunctionTool({
  name: "escalateConversation",
  description:
    "Escalates the customer conversation to human staff when the customer reports a complaint, problem, or requests human help.",
  parameters: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description: "Reason for escalation (e.g. 'Customer complaint about food quality', 'Order cancellation dispute')",
      },
      complaintDetails: {
        type: "string",
        description: "Detailed description of the customer complaint",
      },
    },
    required: ["reason"],
  },
  execute: async ({ reason, complaintDetails } = {}, tool_context) => {
    const { businessId, conversationId } = getToolSessionState(tool_context);
    if (!businessId || !conversationId) {
      return { success: false, error: "MISSING_SESSION_CONTEXT", message: "Conversation context required." };
    }
    return escalateConversationTool.execute({ businessId, conversationId, reason, complaintDetails });
  },
});
