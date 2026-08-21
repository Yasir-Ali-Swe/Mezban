import prisma from "../config/prisma.js";

export const getDashboardStats = async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      todayOrdersCount,
      todayRevenueAggregate,
      activeDealsCount,
      recentOrders,
      recentConversations,
      unavailableMenuItems,
      totalMenuItemsCount,
      telegramConfig,
      businessInfo,
    ] = await Promise.all([
      prisma.order.count({
        where: {
          businessId: req.businessId,
          createdAt: { gte: todayStart },
        },
      }),
      prisma.order.aggregate({
        where: {
          businessId: req.businessId,
          createdAt: { gte: todayStart },
          status: { not: "CANCELLED" },
        },
        _sum: { total: true },
      }),
      prisma.deal.count({
        where: {
          businessId: req.businessId,
          status: "ACTIVE",
        },
      }),
      prisma.order.findMany({
        where: { businessId: req.businessId },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          customer: true,
          items: true,
        },
      }),
      prisma.conversation.findMany({
        where: { businessId: req.businessId },
        orderBy: { lastActivity: "desc" },
        take: 5,
        include: {
          customer: true,
        },
      }),
      prisma.menuItem.findMany({
        where: {
          businessId: req.businessId,
          status: "UNAVAILABLE",
        },
        take: 3,
      }),
      prisma.menuItem.count({
        where: { businessId: req.businessId },
      }),
      prisma.telegramConfig.findUnique({
        where: { businessId: req.businessId },
      }),
      prisma.business.findUnique({
        where: { id: req.businessId },
      }),
    ]);

    const formattedOrders = recentOrders.map((o) => ({
      id: o.orderNumber,
      _id: o.id,
      customer: o.customer.name,
      total: Number(o.total),
      status: o.status.toLowerCase(),
      items: o.items.length,
      time: o.createdAt,
    }));

    const formattedConversations = recentConversations.map((c) => ({
      customer: c.customer.name,
      lastMessage: c.lastMessage || "No messages yet",
      agent: c.agent === "GENERAL_AGENT" ? "AI Agent" : c.agent,
      time: c.lastActivity,
    }));

    // Build meaningful real-data alerts
    const alerts = [];

    // 1. Telegram Status Alert
    if (!telegramConfig || !telegramConfig.isConnected) {
      alerts.push({
        type: "telegram_status",
        message: "Telegram bot is disconnected. Connect a bot in settings to start AI agent customer handling.",
        priority: "high",
        href: "/settings/telegram",
      });
    }

    // 2. Business Profile Alert
    if (!businessInfo || !businessInfo.name || !businessInfo.phone || !businessInfo.address) {
      alerts.push({
        type: "business_profile",
        message: "Your business profile is incomplete. Complete profile details for accurate AI support.",
        priority: "medium",
        href: "/settings/info",
      });
    }

    // 3. Menu Item Alerts
    if (totalMenuItemsCount === 0) {
      alerts.push({
        type: "menu_empty",
        message: "No menu items created yet. Add items to your menu to accept orders.",
        priority: "high",
        href: "/menu/new",
      });
    } else {
      unavailableMenuItems.forEach((item) => {
        alerts.push({
          type: "unavailable_item",
          message: `Menu item "${item.name}" is currently marked unavailable`,
          priority: "medium",
          href: "/menu",
        });
      });
    }

    // 4. Deal Alert
    if (activeDealsCount === 0) {
      alerts.push({
        type: "no_deals",
        message: "No active deals running. Create deals to boost customer engagement.",
        priority: "low",
        href: "/deals/new",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        stats: {
          todayOrders: todayOrdersCount,
          todayRevenue: Number(todayRevenueAggregate._sum.total || 0),
          activeDeals: activeDealsCount,
        },
        recentOrders: formattedOrders,
        recentConversations: formattedConversations,
        alerts,
      },
    });
  } catch (error) {
    console.error("getDashboardStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard stats",
      error: error.message,
    });
  }
};
