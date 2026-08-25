import prisma from "../../../config/prisma.js";

/**
 * Escalates a customer conversation to human restaurant staff.
 * Used for customer complaints, refund requests, delivery disputes,
 * or order cancellation requests for orders that are already in progress.
 */
export const escalateConversationTool = {
  name: "escalateConversation",
  description: "Escalates the current conversation to human staff for complaints, issues, or order problems.",
  execute: async ({ businessId, conversationId, reason, complaintDetails }) => {
    if (!businessId || !conversationId) {
      return { success: false, error: "MISSING_CONTEXT", message: "Conversation and business context required." };
    }

    try {
      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: "ESCALATED",
          intent: "SUPPORT",
        },
      });

      return {
        success: true,
        status: updated.status,
        message: "Conversation has been successfully escalated to our team. A staff member will review and assist shortly.",
      };
    } catch (err) {
      console.error("[escalateConversationTool Error]:", err);
      return {
        success: false,
        error: "ESCALATION_FAILED",
        message: "Failed to escalate conversation.",
      };
    }
  },
};
