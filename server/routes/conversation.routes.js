import { Router } from "express";
import {
  getConversationStats,
  getConversations,
  getConversationById,
  getCustomerAvatarProxy,
  getBotAvatarProxy,
  updateConversationStatus,
} from "../controllers/conversation.controller.js";

const router = Router();

router.get("/stats", getConversationStats);
router.get("/avatar/:customerId", getCustomerAvatarProxy);
router.get("/bot-avatar", getBotAvatarProxy);
router.get("/", getConversations);
router.get("/:id", getConversationById);
router.patch("/:id/status", updateConversationStatus);

export default router;
