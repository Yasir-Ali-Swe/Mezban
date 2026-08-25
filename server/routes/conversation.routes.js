import { Router } from "express";
import {
  getConversationStats,
  getConversations,
  getConversationById,
  getCustomerAvatarProxy,
  getBotAvatarProxy,
  updateConversationStatus,
  sendConversationMessage,
  handleEscalationAction,
} from "../controllers/conversation.controller.js";

const router = Router();

router.get("/stats", getConversationStats);
router.get("/avatar/:customerId", getCustomerAvatarProxy);
router.get("/bot-avatar", getBotAvatarProxy);
router.get("/", getConversations);
router.get("/:id", getConversationById);
router.patch("/:id/status", updateConversationStatus);
router.post("/:id/messages", sendConversationMessage);
router.post("/:id/escalation/action", handleEscalationAction);

export default router;
