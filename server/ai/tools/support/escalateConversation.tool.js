import prisma from "../../../config/prisma.js";

/**
 * Escalates a customer conversation to human restaurant staff.
 * Used for customer complaints, refund requests, delivery disputes,
 * reservation booking requests, or order cancellation requests for orders in progress.
 */
export const escalateConversationTool = {
  name: "escalateConversation",
  description: "Escalates the current conversation to human staff for complaints, issues, reservations, or order problems.",
  execute: async ({ businessId, conversationId, reason, escalationType = "COMPLAINT", complaintDetails, extraData }) => {
    if (!businessId || !conversationId) {
      return { success: false, error: "MISSING_CONTEXT", message: "Conversation and business context required." };
    }

    try {
      const updated = await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          status: "ESCALATED",
          intent: escalationType === "RESERVATION_REQUEST" ? "RESERVATION_INQUIRY" : "SUPPORT",
          escalationType: escalationType || "COMPLAINT",
          escalationReason: reason || "Customer requested human assistance",
          escalationData: {
            complaintDetails: complaintDetails || null,
            ...(extraData || {}),
          },
        },
      });

      return {
        success: true,
        status: updated.status,
        escalationType: updated.escalationType,
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
