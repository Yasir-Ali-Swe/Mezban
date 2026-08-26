import prisma from "../config/prisma.js";
import { sendTelegramMessage } from "../utils/telegram.sender.js";

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

    const [total, resolved, escalated] = await Promise.all([
      prisma.conversation.count({ where }),
      prisma.conversation.count({ where: { ...where, status: "RESOLVED" } }),
      prisma.conversation.count({ where: { ...where, status: "ESCALATED" } }),
    ]);

    const resolutionRate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    const escalationRate = total > 0 ? Math.round((escalated / total) * 100) : 0;

    return res.status(200).json({
      success: true,
      data: {
        total,
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
        escalationType: conv.escalationType || null,
        escalationReason: conv.escalationReason || null,
        escalationData: conv.escalationData || null,
        resolvedByName: conv.resolvedByName || null,
        resolvedAt: conv.resolvedAt ? conv.resolvedAt.toISOString() : null,
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
        if (msg.isHuman) {
          agentName = msg.senderName ? `Staff: ${msg.senderName}` : "Human Support";
        } else {
          const agentType = msg.agentType || conv.agent || "GENERAL_AGENT";
          agentName = agentType.replace(/_/g, " ");
        }
      }

      return {
        id: msg.id,
        conversationId: msg.conversationId,
        senderType: isCustomer ? "customer" : "agent",
        sender: msg.sender,
        isHuman: Boolean(msg.isHuman),
        senderName: msg.senderName || null,
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

    const customerAvatar = conv.customer.avatarUrl
      ? `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${conv.customer.avatarUrl}`
      : null;

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
        escalationType: conv.escalationType || null,
        escalationReason: conv.escalationReason || null,
        escalationData: conv.escalationData || null,
        resolvedByName: conv.resolvedByName || null,
        resolvedAt: conv.resolvedAt ? conv.resolvedAt.toISOString() : null,
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

    const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const avatarUrl = `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${customer.avatarUrl}`;

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

    const baseUrl = process.env.APP_URL || process.env.BASE_URL || `${req.protocol}://${req.get("host")}`;
    const avatarUrl = `${baseUrl}/api/telegram/avatar/${businessId}?fileId=${config.avatarUrl}`;

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
    const { status, resolvedByName } = req.body;

    const validStatuses = ["ACTIVE", "RESOLVED", "ESCALATED", "CLOSED"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid status value",
      });
    }

    const updateData = { status };
    if (status === "RESOLVED") {
      updateData.resolvedByName = resolvedByName || req.user?.name || "Staff";
      updateData.resolvedAt = new Date();
    }

    const conv = await prisma.conversation.findFirst({
      where: { id, businessId },
    });

    if (!conv) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or unauthorized",
      });
    }

    const updated = await prisma.conversation.update({
      where: { id: conv.id },
      data: updateData,
    });

    const io = req.app?.get("io");
    if (io) {
      io.to(`business-${businessId}`).emit("conversation-status-updated", {
        conversationId: updated.id,
        status: updated.status,
        resolvedByName: updated.resolvedByName,
        resolvedAt: updated.resolvedAt,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Conversation status updated successfully",
      data: {
        status: updated.status,
        resolvedByName: updated.resolvedByName,
        resolvedAt: updated.resolvedAt,
      },
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

export const sendConversationMessage = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const { content, message, senderName } = req.body;

    const text = (content || message || "").trim();
    if (!text) {
      return res.status(400).json({
        success: false,
        message: "Message content cannot be empty",
      });
    }

    const conv = await prisma.conversation.findFirst({
      where: { id, businessId },
      include: { customer: true },
    });

    if (!conv) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or unauthorized",
      });
    }

    const resolvedSenderName = senderName || req.user?.name || "Staff";

    // 1. Create message in DB
    const newMessage = await prisma.message.create({
      data: {
        conversationId: conv.id,
        sender: "AGENT",
        agentType: null,
        isHuman: true,
        senderName: resolvedSenderName,
        content: text,
      },
    });

    // 2. Update Conversation activity
    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessage: text,
        lastActivity: new Date(),
      },
    });

    // 3. Send message to Telegram customer
    try {
      const config = await prisma.telegramConfig.findUnique({
        where: { businessId },
      });

      if (config?.botToken && conv.customer?.telegramChatId) {
        await sendTelegramMessage(config.botToken, conv.customer.telegramChatId, text);
      }
    } catch (telegramErr) {
      console.warn("[Send Telegram Message Error]:", telegramErr.message);
    }

    // 4. Emit Socket.IO event for real-time dashboard updates
    const io = req.app?.get("io");
    if (io) {
      io.to(`conversation-${conv.id}`).emit("new-message", {
        id: newMessage.id,
        conversationId: conv.id,
        senderType: "agent",
        sender: "AGENT",
        isHuman: true,
        senderName: resolvedSenderName,
        agentName: `Staff: ${resolvedSenderName}`,
        content: newMessage.content,
        createdAt: newMessage.createdAt.toISOString(),
      });

      io.to(`business-${businessId}`).emit("conversation-updated", {
        conversationId: conv.id,
        lastMessage: text,
        lastActivity: new Date().toISOString(),
      });
    }

    return res.status(201).json({
      success: true,
      data: {
        id: newMessage.id,
        conversationId: conv.id,
        senderType: "agent",
        sender: "AGENT",
        isHuman: true,
        senderName: resolvedSenderName,
        agentName: `Staff: ${resolvedSenderName}`,
        content: newMessage.content,
        createdAt: newMessage.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("sendConversationMessage error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
};

export const handleEscalationAction = async (req, res) => {
  try {
    const businessId = req.businessId;
    const { id } = req.params;
    const { action, note, customMessage, senderName } = req.body;

    const validActions = [
      "ACCEPT_REQUEST",
      "ACCEPT_ESCALATION",
      "CANCEL_ORDER",
      "APPROVE_CANCELLATION",
      "REJECT_REQUEST",
      "REJECT_ESCALATION",
      "REJECT_CANCELLATION",
      "ADD_NOTE",
      "SEND_MESSAGE",
      "RESOLVE",
    ];

    if (!action || !validActions.includes(action)) {
      return res.status(400).json({
        success: false,
        message: `Invalid escalation action "${action}". Valid actions: ${validActions.join(", ")}`,
      });
    }

    const conv = await prisma.conversation.findFirst({
      where: { id, businessId },
      include: { customer: true },
    });

    if (!conv) {
      return res.status(404).json({
        success: false,
        message: "Conversation not found or unauthorized",
      });
    }

    const staffName = senderName || req.user?.name || "Staff";

    // Handle ADD_NOTE (Internal note only - does NOT send to customer on Telegram)
    if (action === "ADD_NOTE") {
      const noteText = (note || customMessage || "").trim();
      if (!noteText) {
        return res.status(400).json({
          success: false,
          message: "Internal note content cannot be empty",
        });
      }

      const existingData = conv.escalationData && typeof conv.escalationData === "object" ? conv.escalationData : {};
      const internalNotes = Array.isArray(existingData.internalNotes) ? existingData.internalNotes : [];
      const newNote = {
        id: `note-${Date.now()}`,
        note: noteText,
        addedBy: staffName,
        addedAt: new Date().toISOString(),
      };

      const updatedData = {
        ...existingData,
        internalNotes: [...internalNotes, newNote],
      };

      const updated = await prisma.conversation.update({
        where: { id: conv.id },
        data: {
          escalationData: updatedData,
          lastActivity: new Date(),
        },
      });

      const io = req.app?.get("io");
      if (io) {
        io.to(`business-${businessId}`).emit("conversation-updated", {
          conversationId: conv.id,
          lastActivity: new Date().toISOString(),
        });
      }

      return res.status(200).json({
        success: true,
        message: "Internal note added successfully",
        data: {
          escalationData: updatedData,
        },
      });
    }

    if (conv.status === "RESOLVED") {
      return res.status(400).json({
        success: false,
        message: `This conversation has already been resolved by ${conv.resolvedByName || "staff"}.`,
      });
    }

    let customerReplyText = "";
    let updatedOrderData = null;
    const isAcceptRequest =
      action === "ACCEPT_REQUEST" ||
      action === "ACCEPT_ESCALATION" ||
      action === "CANCEL_ORDER" ||
      action === "APPROVE_CANCELLATION";
    const isRejectRequest =
      action === "REJECT_REQUEST" ||
      action === "REJECT_ESCALATION" ||
      action === "REJECT_CANCELLATION";

    if (isAcceptRequest || isRejectRequest) {
      const messageText = (customMessage || note || "").trim();
      if (!messageText) {
        return res.status(400).json({
          success: false,
          message: "Please enter a message for the customer before accepting/rejecting this request.",
        });
      }
      customerReplyText = messageText;
    }

    if (isAcceptRequest) {
      const orderNumber = conv.escalationData?.orderNumber;
      const orderId = conv.escalationData?.orderId;

      let order = null;
      if (orderId || orderNumber || conv.escalationType === "ORDER_CANCELLATION") {
        const orderWhere = { businessId };
        if (orderId) {
          orderWhere.id = orderId;
        } else if (orderNumber) {
          orderWhere.orderNumber = orderNumber;
        } else {
          orderWhere.customerId = conv.customerId;
        }

        order = await prisma.order.findFirst({
          where: orderWhere,
          orderBy: { createdAt: "desc" },
        });

        if (order) {
          if (order.status === "COMPLETED") {
            return res.status(400).json({
              success: false,
              message: `This order can no longer be cancelled because its status is COMPLETED.`,
            });
          }

          if (order.status === "CANCELLED") {
            return res.status(400).json({
              success: false,
              message: `This order is already cancelled.`,
            });
          }
        }
      }

      const existingData = conv.escalationData && typeof conv.escalationData === "object" ? conv.escalationData : {};
      const auditLog = Array.isArray(existingData.audit) ? existingData.audit : [];
      const updatedEscalationData = {
        ...existingData,
        resolvedAction: "ACCEPT_REQUEST",
        resolvedBy: staffName,
        decision: "Accepted",
        ...(order ? { previousOrderStatus: order.status, newOrderStatus: "CANCELLED" } : {}),
        audit: [
          ...auditLog,
          {
            action: "ACCEPT_REQUEST",
            staffName,
            ...(order ? { orderNumber: order.orderNumber, previousStatus: order.status, newStatus: "CANCELLED" } : {}),
            note: customMessage || "Request accepted by staff",
            timestamp: new Date().toISOString(),
          },
        ],
      };

      // Atomic transaction for order cancellation (if applicable) + message + conversation resolution
      await prisma.$transaction(async (tx) => {
        if (order) {
          updatedOrderData = await tx.order.update({
            where: { id: order.id },
            data: { status: "CANCELLED" },
          });
        }

        await tx.message.create({
          data: {
            conversationId: conv.id,
            sender: "AGENT",
            isHuman: true,
            senderName: staffName,
            content: customerReplyText,
          },
        });

        await tx.conversation.update({
          where: { id: conv.id },
          data: {
            status: "RESOLVED",
            resolvedByName: staffName,
            resolvedAt: new Date(),
            escalationData: updatedEscalationData,
            lastMessage: customerReplyText,
            lastActivity: new Date(),
          },
        });
      });

      // Emit order-status-updated via Socket.IO if order changed
      if (order && updatedOrderData) {
        const io = req.app?.get("io");
        if (io) {
          io.to(`business-${businessId}`).emit("order-status-updated", {
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: "cancelled",
            updatedAt: new Date().toISOString(),
          });
        }
      }
    } else if (isRejectRequest) {
      const orderNumber = conv.escalationData?.orderNumber;
      const orderId = conv.escalationData?.orderId;

      let order = null;
      if (orderId || orderNumber || conv.escalationType === "ORDER_CANCELLATION") {
        const orderWhere = { businessId };
        if (orderId) {
          orderWhere.id = orderId;
        } else if (orderNumber) {
          orderWhere.orderNumber = orderNumber;
        } else {
          orderWhere.customerId = conv.customerId;
        }

        order = await prisma.order.findFirst({
          where: orderWhere,
          orderBy: { createdAt: "desc" },
        });
      }

      if (!customerReplyText) {
        customerReplyText = customMessage || "Your request has been reviewed and declined by staff.";
      }

      const existingData = conv.escalationData && typeof conv.escalationData === "object" ? conv.escalationData : {};
      const auditLog = Array.isArray(existingData.audit) ? existingData.audit : [];
      const updatedEscalationData = {
        ...existingData,
        resolvedAction: "REJECT_REQUEST",
        resolvedBy: staffName,
        decision: "Rejected",
        audit: [
          ...auditLog,
          {
            action: "REJECT_REQUEST",
            staffName,
            ...(order ? { orderNumber: order?.orderNumber } : {}),
            note: customMessage || "Request rejected by staff",
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await prisma.$transaction(async (tx) => {
        await tx.message.create({
          data: {
            conversationId: conv.id,
            sender: "AGENT",
            isHuman: true,
            senderName: staffName,
            content: customerReplyText,
          },
        });

        await tx.conversation.update({
          where: { id: conv.id },
          data: {
            status: "RESOLVED",
            resolvedByName: staffName,
            resolvedAt: new Date(),
            escalationData: updatedEscalationData,
            lastMessage: customerReplyText,
            lastActivity: new Date(),
          },
        });
      });
    } else if (action === "RESOLVE") {
      customerReplyText =
        customMessage || "Your request has been resolved by our staff team. Thank you for contacting us!";

      const existingData = conv.escalationData && typeof conv.escalationData === "object" ? conv.escalationData : {};
      const auditLog = Array.isArray(existingData.audit) ? existingData.audit : [];
      const updatedEscalationData = {
        ...existingData,
        resolvedAction: "RESOLVE",
        resolvedBy: staffName,
        audit: [
          ...auditLog,
          {
            action: "RESOLVE",
            staffName,
            note: customMessage || "Resolved by staff",
            timestamp: new Date().toISOString(),
          },
        ],
      };

      await prisma.$transaction(async (tx) => {
        if (customMessage) {
          await tx.message.create({
            data: {
              conversationId: conv.id,
              sender: "AGENT",
              isHuman: true,
              senderName: staffName,
              content: customerReplyText,
            },
          });
        }

        await tx.conversation.update({
          where: { id: conv.id },
          data: {
            status: "RESOLVED",
            resolvedByName: staffName,
            resolvedAt: new Date(),
            escalationData: updatedEscalationData,
            ...(customMessage ? { lastMessage: customerReplyText, lastActivity: new Date() } : {}),
          },
        });
      });
    }

    // Send notification to customer on Telegram
    if (customerReplyText && conv.customer?.telegramChatId) {
      try {
        const config = await prisma.telegramConfig.findUnique({
          where: { businessId },
        });
        if (config?.botToken) {
          await sendTelegramMessage(config.botToken, conv.customer.telegramChatId, customerReplyText);
        }
      } catch (telegramErr) {
        console.warn("[Telegram Escalation Action Notify Error]:", telegramErr.message);
      }
    }

    // Socket.IO real-time emission
    const io = req.app?.get("io");
    if (io) {
      if (customerReplyText) {
        io.to(`conversation-${conv.id}`).emit("new-message", {
          id: `msg-${Date.now()}`,
          conversationId: conv.id,
          senderType: "agent",
          sender: "AGENT",
          isHuman: true,
          senderName: staffName,
          agentName: `Staff: ${staffName}`,
          content: customerReplyText,
          createdAt: new Date().toISOString(),
        });
      }

      io.to(`business-${businessId}`).emit("conversation-status-updated", {
        conversationId: conv.id,
        status: "RESOLVED",
        resolvedByName: staffName,
        resolvedAt: new Date().toISOString(),
      });

      io.to(`business-${businessId}`).emit("conversation-updated", {
        conversationId: conv.id,
        lastMessage: customerReplyText || conv.lastMessage,
        lastActivity: new Date().toISOString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: `Escalation action '${action}' completed successfully`,
      data: {
        status: "RESOLVED",
        resolvedByName: staffName,
        resolvedAt: new Date().toISOString(),
        order: updatedOrderData,
      },
    });
  } catch (error) {
    console.error("handleEscalationAction error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process escalation action",
      error: error.message,
    });
  }
};
