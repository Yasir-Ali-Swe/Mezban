import crypto from "crypto";
import prisma from "../config/prisma.js";

export const getTelegramConfig = async (req, res) => {
  try {
    const config = await prisma.telegramConfig.findUnique({
      where: { businessId: req.businessId },
    });

    if (!config || !config.isConnected) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const safeUsername = config.botUsername ? (config.botUsername.startsWith("@") ? config.botUsername : `@${config.botUsername}`) : "";

    // Build the avatar URL using the proxy endpoint
    const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const avatarUrl = config.avatarUrl
      ? `${baseUrl}/api/telegram/avatar/${req.businessId}?fileId=${config.avatarUrl}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(config.botName)}&background=0088CC&color=fff&size=128`;

    return res.status(200).json({
      success: true,
      data: {
        bot: {
          id: config.botId,
          name: config.botName,
          username: safeUsername,
          avatarUrl: avatarUrl, // ✅ Use proxy URL
          isConnected: config.isConnected,
          connectedOn: config.connectedAt,
        },
        botLinks: {
          botLink: config.botLink,
          deepLink: config.deepLink,
        },
        webhook: {
          status: config.webhookStatus || (config.isConnected ? "connected" : "disconnected"),
          url: config.webhookUrl,
          lastUpdate: config.lastUpdateAt,
        },
      },
    });
  } catch (error) {
    console.error("getTelegramConfig error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch Telegram config",
      error: error.message,
    });
  }
};

export const connectTelegramBot = async (req, res) => {
  try {
    const { botToken } = req.body;
    console.log("[Telegram Connect DEBUG] Received connect request:", {
      hasBotToken: !!botToken,
      botTokenLength: botToken ? botToken.length : 0,
      businessId: req.businessId,
    });

    if (!botToken || !botToken.trim()) {
      console.log("[Telegram Connect DEBUG] Validation failed: Bot token missing");
      return res.status(400).json({
        success: false,
        message: "Telegram bot token is required",
      });
    }

    const token = botToken.trim();

    // 1. Validate token with official Telegram getMe API
    let botData = null;
    console.log("[Telegram Connect DEBUG] Calling Telegram getMe API...");
    try {
      const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
      const data = await response.json();
      console.log("[Telegram Connect DEBUG] Telegram getMe response:", JSON.stringify(data));

      if (data.ok && data.result) {
        botData = data.result;
      } else {
        console.log("[Telegram Connect DEBUG] Telegram getMe failed:", data);
        return res.status(400).json({
          success: false,
          message: data.description || "Invalid Telegram bot token. Please check the token provided by BotFather.",
        });
      }
    } catch (e) {
      console.error("[Telegram Connect DEBUG] Telegram getMe API request error:", e.message);
      return res.status(502).json({
        success: false,
        message: "Could not connect to Telegram API. Please try again later.",
      });
    }

    // 2. Extract authentic Telegram identity
    const botId = String(botData.id);
    const firstName = botData.first_name || "";
    const lastName = botData.last_name || null;
    const username = botData.username || null;

    const botName = [firstName, lastName].filter(Boolean).join(" ") || username || "Telegram Bot";
    const botUsername = (username || "").replace(/^@/, "");
    const botLink = botUsername ? `https://t.me/${botUsername}` : "";
    const deepLink = botUsername ? `https://t.me/${botUsername}?start=${req.businessId}` : "";

    // 3. Generate secure webhook secret and URL
    const webhookSecret = crypto.randomBytes(32).toString("hex");
    const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const webhookUrl = `${baseUrl}/api/telegram/webhook/${req.businessId}`;
    console.log("[Telegram Connect DEBUG] Webhook configuration:", {
      baseUrl,
      webhookUrl,
      isHttps: webhookUrl.startsWith("https://"),
      isLocalhost: webhookUrl.includes("localhost") || webhookUrl.includes("127.0.0.1"),
    });

    // 4. Configure Telegram Webhook via official setWebhook API
    let webhookStatus = "connected";
    const isLocal = webhookUrl.includes("localhost") || webhookUrl.includes("127.0.0.1") || !webhookUrl.startsWith("https://");

    if (isLocal) {
      console.warn("[Telegram Connect DEBUG] Webhook URL is HTTP/Localhost. Telegram setWebhook requires HTTPS with a public URL.");
    }

    try {
      console.log("[Telegram Connect DEBUG] Calling Telegram setWebhook API with URL:", webhookUrl);
      const setWebhookRes = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: webhookUrl,
          secret_token: webhookSecret,
        }),
      });
      const setWebhookData = await setWebhookRes.json();
      console.log("[Telegram Connect DEBUG] Telegram setWebhook response:", JSON.stringify(setWebhookData));

      if (!setWebhookData.ok) {
        console.error("[Telegram Connect DEBUG] setWebhook rejected by Telegram:", setWebhookData.description);
        if (isLocal) {
          console.warn("[Telegram Connect DEBUG] Bypassing setWebhook requirement for local development environment.");
          webhookStatus = "development_mode (webhook skipped - HTTPS required)";
        } else {
          return res.status(400).json({
            success: false,
            message: setWebhookData.description || "Failed to set Telegram webhook.",
          });
        }
      }
    } catch (e) {
      console.error("[Telegram Connect DEBUG] Telegram setWebhook API call error:", e.message);
      if (isLocal) {
        console.warn("[Telegram Connect DEBUG] Bypassing setWebhook fetch error for local development environment.");
        webhookStatus = "development_mode (webhook error)";
      } else {
        return res.status(502).json({
          success: false,
          message: "Failed to reach Telegram API for webhook configuration.",
        });
      }
    }

    // 5. Verify webhook via getWebhookInfo
    try {
      const infoRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
      const infoData = await infoRes.json();
      if (!infoData.ok || infoData.result?.last_error_message) {
        console.warn("Telegram webhook info warning:", infoData.result?.last_error_message);
      }
    } catch (e) {
      console.warn("Telegram getWebhookInfo check failed:", e.message);
    }

    // 6. Fetch Telegram Bot profile photo - STORE FILE_ID, NOT FILE_PATH
    let botAvatarFileId = null;
    try {
      const photosRes = await fetch(
        `https://api.telegram.org/bot${token}/getUserProfilePhotos?user_id=${botId}&limit=1`
      );
      const photosData = await photosRes.json();
      if (photosData.ok && photosData.result?.total_count > 0) {
        const photoSizes = photosData.result.photos[0];
        const largestPhoto = photoSizes[photoSizes.length - 1];
        if (largestPhoto?.file_id) {
          botAvatarFileId = largestPhoto.file_id; // ✅ Store the permanent file_id
        }
      }
    } catch (avatarErr) {
      console.warn("Could not fetch bot profile photo during connect:", avatarErr.message);
    }

    // 7. Save real Telegram identity and configuration to database
    const config = await prisma.telegramConfig.upsert({
      where: { businessId: req.businessId },
      update: {
        botId,
        botName,
        botUsername,
        botToken: token,
        botLink,
        deepLink,
        webhookUrl,
        webhookSecret,
        webhookStatus,
        firstName,
        lastName,
        username,
        avatarUrl: botAvatarFileId, // ✅ Store file_id
        isConnected: true,
        connectedAt: new Date(),
        lastUpdateAt: new Date(),
      },
      create: {
        businessId: req.businessId,
        botId,
        botName,
        botUsername,
        botToken: token,
        botLink,
        deepLink,
        webhookUrl,
        webhookSecret,
        webhookStatus,
        firstName,
        lastName,
        username,
        avatarUrl: botAvatarFileId, // ✅ Store file_id
        isConnected: true,
        connectedAt: new Date(),
        lastUpdateAt: new Date(),
      },
    });

    const safeUsername = config.botUsername ? (config.botUsername.startsWith("@") ? config.botUsername : `@${config.botUsername}`) : "";

    // 8. Build the avatar URL using the proxy endpoint
    const avatarUrl = config.avatarUrl
      ? `${baseUrl}/api/telegram/avatar/${req.businessId}?fileId=${config.avatarUrl}`
      : `https://ui-avatars.com/api/?name=${encodeURIComponent(config.botName)}&background=0088CC&color=fff&size=128`;

    return res.status(200).json({
      success: true,
      data: {
        bot: {
          id: config.botId,
          name: config.botName,
          username: safeUsername,
          avatarUrl: avatarUrl, // ✅ Use proxy URL
          isConnected: true,
          connectedOn: config.connectedAt,
        },
        botLinks: {
          botLink: config.botLink,
          deepLink: config.deepLink,
        },
        webhook: {
          status: config.webhookStatus || "connected",
          url: config.webhookUrl,
          lastUpdate: config.lastUpdateAt,
        },
      },
      message: "Telegram bot connected successfully",
    });
  } catch (error) {
    console.error("[Telegram Connect DEBUG] connectTelegramBot error:", error);
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        message: "This Telegram bot is already registered to another account.",
        error: error.message,
      });
    }
    return res.status(500).json({
      success: false,
      message: "Failed to connect Telegram bot",
      error: error.message,
    });
  }
};

export const processTelegramUpdate = async (config, update) => {
  const message = update.message || update.edited_message;
  if (!message || !message.from || !message.chat) return;

  const businessId = config.businessId;
  const telegramUserId = String(message.from.id);
  const telegramChatId = String(message.chat.id);
  const firstName = message.from.first_name || "";
  const lastName = message.from.last_name || "";
  const username = message.from.username || null;
  const languageCode = message.from.language_code || null;
  const telegramMessageId = String(message.message_id);
  const telegramUpdateId = update.update_id ? String(update.update_id) : null;

  const customerName = [firstName, lastName].filter(Boolean).join(" ") || username || "Telegram User";

  // 1. Fetch customer Telegram profile photo - STORE FILE_ID
  let avatarFileId = null;
  try {
    const photosRes = await fetch(
      `https://api.telegram.org/bot${config.botToken}/getUserProfilePhotos?user_id=${telegramUserId}&limit=1`
    );
    const photosData = await photosRes.json();
    if (photosData.ok && photosData.result?.total_count > 0) {
      const photoSizes = photosData.result.photos[0];
      const largestPhoto = photoSizes[photoSizes.length - 1];
      if (largestPhoto?.file_id) {
        avatarFileId = largestPhoto.file_id; // ✅ Store the permanent file_id
      }
    }
  } catch (photoErr) {
    console.warn("[Telegram Process] Could not fetch user profile photo:", photoErr.message);
  }

  // 2. Upsert Customer record
  const customer = await prisma.customer.upsert({
    where: {
      businessId_telegramChatId: {
        businessId,
        telegramChatId,
      },
    },
    update: {
      name: customerName,
      telegramUserId,
      firstName,
      lastName,
      username,
      languageCode,
      ...(avatarFileId && { avatarUrl: avatarFileId }), // ✅ Store file_id
    },
    create: {
      businessId,
      telegramChatId,
      telegramUserId,
      name: customerName,
      firstName,
      lastName,
      username,
      languageCode,
      avatarUrl: avatarFileId, // ✅ Store file_id
    },
  });

  // 3. Find or Create Active Conversation
  let conversation = await prisma.conversation.findFirst({
    where: {
      businessId,
      customerId: customer.id,
      status: "ACTIVE",
    },
  });

  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        businessId,
        customerId: customer.id,
        status: "ACTIVE",
        agent: "GENERAL_AGENT",
        lastActivity: new Date(),
      },
    });
  }

  // 4. Non-Text Message Handling
  if (!message.text) {
    const unsupportedText = "Voice messages and media are not supported yet. Please send your message as text.";
    try {
      await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: unsupportedText,
        }),
      });
    } catch (err) {
      console.error("[Telegram Process] Failed to send unsupported message warning:", err.message);
    }
    return;
  }

  const messageText = message.text.trim();

  // 5. Duplicate Message Protection
  const existingMsg = await prisma.message.findFirst({
    where: {
      conversationId: conversation.id,
      telegramMessageId,
    },
  });

  if (existingMsg) {
    console.log(`[Telegram Process] Message ${telegramMessageId} already processed. Skipping.`);
    return;
  }

  // 6. Store Customer Message in DB
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: "CUSTOMER",
      content: messageText,
      telegramMessageId,
      telegramUpdateId,
    },
  });

  // 7. Generate Bot / Agent Response
  let replyText = "";
  if (messageText.toLowerCase() === "/start") {
    replyText = `Hello ${firstName || customerName}! Welcome to ${config.botName || "our restaurant"}. How can I help you today?`;
  } else {
    replyText = `Thank you for your message! Our AI assistant (${config.botName || "TeleAgent"}) has received your inquiry: "${messageText}". How else can we assist you?`;
  }

  // 8. Send Agent Response via Telegram API
  let agentMessageId = null;
  try {
    const sendRes = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: telegramChatId,
        text: replyText,
      }),
    });
    const sendData = await sendRes.json();
    if (sendData.ok && sendData.result?.message_id) {
      agentMessageId = String(sendData.result.message_id);
    }
  } catch (sendErr) {
    console.error("[Telegram Process] Failed to send Telegram agent response:", sendErr.message);
  }

  // 9. Store Agent Message in DB & update conversation metadata
  await prisma.message.create({
    data: {
      conversationId: conversation.id,
      sender: "AGENT",
      agentType: "GENERAL_AGENT",
      content: replyText,
      telegramMessageId: agentMessageId,
    },
  });

  await prisma.conversation.update({
    where: { id: conversation.id },
    data: {
      lastMessage: replyText,
      lastActivity: new Date(),
    },
  });
};

export const syncPendingTelegramUpdates = async (businessId) => {
  try {
    const config = await prisma.telegramConfig.findUnique({
      where: { businessId },
    });

    if (!config || !config.isConnected || !config.botToken) return;

    const updatesRes = await fetch(`https://api.telegram.org/bot${config.botToken}/getUpdates`);
    const updatesData = await updatesRes.json();

    if (updatesData.ok && Array.isArray(updatesData.result) && updatesData.result.length > 0) {
      console.log(`[Telegram Sync] Syncing ${updatesData.result.length} pending updates for business ${businessId}...`);
      let maxUpdateId = 0;
      for (const update of updatesData.result) {
        await processTelegramUpdate(config, update);
        if (update.update_id > maxUpdateId) {
          maxUpdateId = update.update_id;
        }
      }
      if (maxUpdateId > 0) {
        // Acknowledge updates with offset to clear queue on Telegram
        await fetch(`https://api.telegram.org/bot${config.botToken}/getUpdates?offset=${maxUpdateId + 1}`);
      }
    }
  } catch (err) {
    console.error(`[Telegram Sync] Error syncing updates for business ${businessId}:`, err.message);
  }
};

export const handleTelegramWebhook = async (req, res) => {
  try {
    const { businessId } = req.params;
    const secretToken = req.headers["x-telegram-bot-api-secret-token"];

    if (!businessId) {
      return res.status(400).json({ success: false, message: "Business ID is required" });
    }

    const config = await prisma.telegramConfig.findUnique({
      where: { businessId },
    });

    if (!config || !config.webhookSecret || config.webhookSecret !== secretToken) {
      console.warn(`[Telegram Webhook] Rejected unauthorized request for business ${businessId}`);
      return res.status(403).json({ success: false, message: "Unauthorized webhook request" });
    }

    const update = req.body;
    await processTelegramUpdate(config, update);

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("handleTelegramWebhook error:", error);
    return res.status(500).json({ success: false, message: "Webhook processing error" });
  }
};

export const disconnectTelegramBot = async (req, res) => {
  try {
    const config = await prisma.telegramConfig.findUnique({
      where: { businessId: req.businessId },
    });

    if (config && config.botToken) {
      try {
        await fetch(`https://api.telegram.org/bot${config.botToken}/deleteWebhook`);
      } catch (err) {
        console.warn("Could not delete Telegram webhook:", err.message);
      }
    }

    if (config) {
      await prisma.telegramConfig.update({
        where: { businessId: req.businessId },
        data: {
          isConnected: false,
          botToken: "",
          webhookStatus: "disconnected",
          lastUpdateAt: new Date(),
        },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Telegram bot disconnected successfully",
    });
  } catch (error) {
    console.error("disconnectTelegramBot error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to disconnect Telegram bot",
      error: error.message,
    });
  }
};

// Avatar proxy endpoint
export const getTelegramAvatar = async (req, res) => {
  try {
    const { businessId } = req.params;
    const { fileId } = req.query;

    if (!fileId) {
      return res.status(400).json({ success: false, message: "fileId is required" });
    }

    // Get the bot config to get the token
    const config = await prisma.telegramConfig.findUnique({
      where: { businessId },
    });

    if (!config || !config.botToken) {
      return res.status(404).json({ success: false, message: "Bot not configured" });
    }

    // Get the file path from Telegram
    const fileRes = await fetch(
      `https://api.telegram.org/bot${config.botToken}/getFile?file_id=${fileId}`
    );
    const fileData = await fileRes.json();

    if (!fileData.ok || !fileData.result?.file_path) {
      return res.status(404).json({ success: false, message: "Avatar not found" });
    }

    // Fetch the actual image
    const fileUrl = `https://api.telegram.org/file/bot${config.botToken}/${fileData.result.file_path}`;
    const imageRes = await fetch(fileUrl);

    if (!imageRes.ok) {
      return res.status(404).json({ success: false, message: "Failed to fetch avatar" });
    }

    // Set proper headers
    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    res.set("Content-Type", contentType);
    res.set("Cache-Control", "public, max-age=3600"); // Cache for 1 hour

    // Send the image
    const buffer = Buffer.from(await imageRes.arrayBuffer());
    return res.send(buffer);
  } catch (error) {
    console.error("getTelegramAvatar error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch avatar",
      error: error.message,
    });
  }
};
