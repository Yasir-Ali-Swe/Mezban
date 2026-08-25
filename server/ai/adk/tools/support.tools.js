import { FunctionTool } from "@google/adk";
import { escalateConversationTool } from "../../tools/support/escalateConversation.tool.js";
import { getToolSessionState } from "./context.helper.js";

/**
 * ADK FunctionTool wrapper: escalateConversation
 */
export const adkEscalateConversationTool = new FunctionTool({
  name: "escalateConversation",
  description:
    "Escalates the customer conversation to human staff when the customer reports a complaint, problem, asks for reservation assistance while bookings are paused, or requests human intervention.",
  parameters: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description: "Reason for escalation (e.g. 'Customer complaint about food quality', 'Table reservation request while paused', 'Order dispute')",
      },
      escalationType: {
        type: "string",
        description: "Type of escalation: 'COMPLAINT', 'RESERVATION_REQUEST', 'ORDER_PROBLEM', 'PAYMENT_PROBLEM', 'REFUND_REQUEST', 'OTHER'",
        enum: ["COMPLAINT", "RESERVATION_REQUEST", "ORDER_PROBLEM", "PAYMENT_PROBLEM", "REFUND_REQUEST", "OTHER"],
      },
      complaintDetails: {
        type: "string",
        description: "Detailed description of the customer request or complaint",
      },
    },
    required: ["reason"],
  },
  execute: async ({ reason, escalationType = "COMPLAINT", complaintDetails } = {}, tool_context) => {
    const { businessId, conversationId } = getToolSessionState(tool_context);
    if (!businessId || !conversationId) {
      return { success: false, error: "MISSING_SESSION_CONTEXT", message: "Conversation context required." };
    }
    return escalateConversationTool.execute({
      businessId,
      conversationId,
      reason,
      escalationType,
      complaintDetails,
    });
  },
});
