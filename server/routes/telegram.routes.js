import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getTelegramConfig,
  connectTelegramBot,
  handleTelegramWebhook,
  disconnectTelegramBot,
  getTelegramAvatar,
} from "../controllers/telegram.controller.js";

const router = Router();

// Unauthenticated webhook callback endpoint for Telegram servers
router.post("/webhook/:businessId", handleTelegramWebhook);

// Avatar endpoint - needs to be accessible without auth for images
router.get("/avatar/:businessId", getTelegramAvatar);

// Protected endpoints requiring authentication
router.use(requireAuth);

router.route("/").get(getTelegramConfig);
router.route("/connect").post(connectTelegramBot);
router.route("/disconnect").post(disconnectTelegramBot);
router.route("/status").get(getTelegramConfig);

export default router;