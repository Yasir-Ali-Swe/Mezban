import prisma from "../config/prisma.js";

// Helper function to transform customer avatar
const transformCustomerAvatar = (customer, businessId, req) => {
  if (!customer) return customer;

  const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

  return {
    ...customer,
    avatar: customer.avatarUrl
      ? `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${customer.avatarUrl}`
      : null,
  };
};

// Helper function to get bot avatar URL
const getBotAvatarUrl = (config, businessId, req) => {
  const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

  if (config?.avatarUrl) {
    return `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${config.avatarUrl}`;
  }
  return null;
};

export const getConversationStats = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { dateRange = "all" } = req.query;

    // ✅ REMOVED: await syncPendingTelegramUpdates(businessId);

    const where = { businessId };
    if (dateRange !== "all") {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }
      where.lastActivity = { gte: startDate };
    }

    const [total, active, resolved, escalated] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.count({ where: { ...where, status: "ACTIVE" } }),
      prisma.conversation.count({ where: { ...where, status: "RESOLVED" } }),
      prisma.conversation.count({ where: { ...where, status: "ESCALATED" } }),
    ]);

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const escalationRate = total > 0 ? Math.round((escalated / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        total,
        active,
        resolved,
        resolutionRate,
        escalated,
        escalationRate,
      },
    });
  } catch (error) {
    console.error("getConversationStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation statistics",
      error: error.message,
    });
  }
};

export const getConversations = async (req, res) => {
  try {
    const businessId = req.businessId;
    const {
      page = 1,
      limit = 10,
      search = "",
      status,
      intent,
      agent,
      dateRange = "all",
    } = req.query;

    // ✅ REMOVED: await syncPendingTelegramUpdates(businessId);

    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = { businessId };

    if (status && status !== "all") {
      where.status = status;
    }
    if (intent && intent !== "all") {
      where.intent = intent;
    }
    if (agent && agent !== "all") {
      where.agent = agent;
    }

    if (dateRange !== "all") {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === "today") {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      } else if (dateRange === "week") {
        startDate.setDate(now.getDate() - 7);
      } else if (dateRange === "month") {
        startDate.setMonth(now.getMonth() - 1);
      }
      where.lastActivity = { gte: startDate };
    }

    if (search && search.trim()) {
      const query = search.trim();
      where.OR = [
        { customer: { name: { contains: query, mode: "insensitive" } } },
        { customer: { username: { contains: query, mode: "insensitive" } } },
        { customer: { telegramChatId: { contains: query, mode: "insensitive" } } },
        { customer: { telegramUserId: { contains: query, mode: "insensitive" } } },
        { lastMessage: { contains: query, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              username: true,
              firstName: true,
              lastName: true,
              telegramChatId: true,
              telegramUserId: true,
              avatarUrl: true,
            },
          },
        },
        orderBy: { lastActivity: "desc" },
        skip,
        take: limitNum,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum) || 1;

    // Get bot config for avatar
    const config = await prisma.telegramConfig.findUnique({
      where: { businessId },
    });
    const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;

    const formattedData = items.map((conv) => {
      const customerName =
        conv.customer.name ||
        [conv.customer.firstName, conv.customer.lastName].filter(Boolean).join(" ") ||
        "Telegram User";

      const displayUsername = conv.customer.username
        ? (conv.customer.username.startsWith("@") ? conv.customer.username : `@${conv.customer.username}`)
        : `@${conv.customer.telegramChatId}`;

      // Transform customer avatar using the unified proxy
      const customerAvatar = conv.customer.avatarUrl
        ? `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${conv.customer.avatarUrl}`
        : null;

      return {
        id: conv.id,
        _id: conv.id,
        customer: {
          id: conv.customer.id,
          name: customerName,
          username: conv.customer.username || null,
          displayUsername,
          telegramId: conv.customer.telegramChatId,
          telegramUserId: conv.customer.telegramUserId,
          avatar: customerAvatar,
        },
        intent: conv.intent || null,
        agent: conv.agent || "GENERAL_AGENT",
        status: conv.status,
        lastMessage: conv.lastMessage || "",
        lastActivity: conv.lastActivity.toISOString(),
      };
    });

    return res.status(200).json({
      success: true,
      data: formattedData,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error("getConversations error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversations",
      error: error.message,
    });
  }
};

export const getConversationById = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;

    const conv = await prisma.conversation.findFirst({
      where: {
        id,
        businessId,
      },
      include: {
        customer: true,
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!conv) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found",
      });
    }

    const customerName =
      conv.customer.name ||
      [conv.customer.firstName, conv.customer.lastName].filter(Boolean).join(" ") ||
      "Telegram User";

    const displayUsername = conv.customer.username
      ? (conv.customer.username.startsWith("@") ? conv.customer.username : `@${conv.customer.username}`)
      : `@${conv.customer.telegramChatId}`;

    const formattedMessages = conv.messages.map((msg) => {
      const isCustomer = msg.sender === "CUSTOMER";
      let agentName = null;
      if (!isCustomer) {
        const agentType = msg.agentType || conv.agent || "GENERAL_AGENT";
        agentName = agentType.replace(/_/g, " ");
      }

      return {
        id: msg.id,
        conversationId: msg.conversationId,
        senderType: isCustomer ? "customer" : "agent",
        sender: msg.sender,
        content: msg.content,
        agentType: msg.agentType || conv.agent || "GENERAL_AGENT",
        agentName,
        createdAt: msg.createdAt.toISOString(),
      };
    });

    // Get bot config for avatar
    const config = await prisma.telegramConfig.findUnique({
      where: { businessId },
    });
    const host = (req.get ? req.get("host") : req.headers?.host) || "localhost:5000";
    const protocol = req.protocol || "http";
    const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${protocol}://${host}`;

    // Transform customer avatar using unified proxy
    const customerAvatar = conv.customer.avatarUrl
      ? `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${conv.customer.avatarUrl}`
      : null;

    // Get bot avatar using unified proxy
    const botAvatar = config?.avatarUrl
      ? `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${config.avatarUrl}`
      : null;

    return res.status(200).json({
      success: true,
      data: {
        id: conv.id,
        customer: {
          id: conv.customer.id,
          name: customerName,
          username: conv.customer.username || null,
          displayUsername,
          telegramId: conv.customer.telegramChatId,
          avatar: customerAvatar,
        },
        botName: config?.botName || "TeleAgent AI",
        botAvatar: botAvatar,
        status: conv.status,
        intent: conv.intent,
        agent: conv.agent,
        lastMessageAt: conv.lastActivity.toISOString(),
        messages: formattedMessages,
      },
    });
  } catch (error) {
    console.error("getConversationById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch conversation details",
      error: error.message,
    });
  }
};

// These proxy functions are now deprecated - use the unified /api/telegram/avatar endpoint instead
// Keeping them for backward compatibility but they should be removed or redirected
export const getCustomerAvatarProxy = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { customerId } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });

    if (!customer || !customer.avatarUrl) {
      return res.status(404).send("Avatar not found");
    }

    // Redirect to the unified avatar endpoint
    const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const avatarUrl = `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${customer.avatarUrl}`;

    // Fetch the image and return it
    const response = await fetch(avatarUrl);
    if (!response.ok) {
      return res.status(404).send("Avatar not found");
    }

    const buffer = await response.arrayBuffer();
    res.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("getCustomerAvatarProxy error:", error);
    return res.status(500).send("Avatar fetch error");
  }
};

export const getBotAvatarProxy = async (req, res) => {
  try {
    const businessId = req.businessId;

    const config = await prisma.telegramConfig.findUnique({
      where: { businessId },
    });

    if (!config || !config.botToken) {
      return res.status(404).send("Telegram bot not configured");
    }

    if (!config.avatarUrl) {
      return res.status(404).send("Bot avatar not found");
    }

    // Redirect to the unified avatar endpoint
    const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const avatarUrl = `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${config.avatarUrl}`;

    // Fetch the image and return it
    const response = await fetch(avatarUrl);
    if (!response.ok) {
      return res.status(404).send("Avatar not found");
    }

    const buffer = await response.arrayBuffer();
    res.set("Content-Type", response.headers.get("content-type") || "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    return res.send(Buffer.from(buffer));
  } catch (error) {
    console.error("getBotAvatarProxy error:", error);
    return res.status(500).send("Bot avatar fetch error");
  }
};

export const updateConversationStatus = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["ACTIVE", "RESOLVED", "ESCALATED", "CLOSED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updated = await prisma.conversation.updateMany({
      where: { id, businessId },
      data: { status },
    });

    if (updated.count === 0) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or unauthorized",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation status updated successfully",
    });
  } catch (error) {
    console.error("updateConversationStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update conversation status",
      error: error.message,
    });
  }
};
