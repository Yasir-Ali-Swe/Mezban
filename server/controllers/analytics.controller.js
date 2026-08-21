import prisma from "../config/prisma.js";

// Helper to calculate date ranges based on timeRange
const getDateRanges = (timeRange) => {
  const now = new Date();
  let days = 7;
  if (timeRange === "monthly") days = 30;
  if (timeRange === "yearly") days = 365;

  const currentStart = new Date(now);
  currentStart.setDate(currentStart.getDate() - days);

  const prevStart = new Date(currentStart);
  prevStart.setDate(prevStart.getDate() - days);

  return { now, days, currentStart, prevStart };
};

// Helper to compute percentage change
const calcPercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  const change = ((current - previous) / previous) * 100;
  return Number(change.toFixed(1));
};

// ============================================================
// BUSINESS ANALYTICS CONTROLLER
// ============================================================
export const getBusinessAnalytics = async (req, res) => {
  try {
    const { timeRange = "weekly" } = req.query;
    const { now, days, currentStart, prevStart } = getDateRanges(timeRange);

    const businessId = req.businessId;

    // 1. Fetch current & previous period orders for overview metrics
    const [currentOrders, prevOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          businessId,
          createdAt: { gte: currentStart, lte: now },
        },
        include: { items: true },
      }),
      prisma.order.findMany({
        where: {
          businessId,
          createdAt: { gte: prevStart, lt: currentStart },
        },
        include: { items: true },
      }),
    ]);

    // Current period overview calculations
    const validCurrentOrders = currentOrders.filter((o) => o.status !== "CANCELLED");
    const currentRevenue = validCurrentOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const currentOrderCount = currentOrders.length;
    const currentAvgOrder = currentOrderCount > 0 ? currentRevenue / currentOrderCount : 0;
    const currentUnitsSold = validCurrentOrders.reduce(
      (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    // Previous period overview calculations
    const validPrevOrders = prevOrders.filter((o) => o.status !== "CANCELLED");
    const prevRevenue = validPrevOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
    const prevOrderCount = prevOrders.length;
    const prevAvgOrder = prevOrderCount > 0 ? prevRevenue / prevOrderCount : 0;
    const prevUnitsSold = validPrevOrders.reduce(
      (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
      0
    );

    const overview = {
      revenue: Math.round(currentRevenue),
      revenueChange: calcPercentageChange(currentRevenue, prevRevenue),
      orders: currentOrderCount,
      ordersChange: calcPercentageChange(currentOrderCount, prevOrderCount),
      avgOrderValue: Math.round(currentAvgOrder),
      avgOrderChange: calcPercentageChange(currentAvgOrder, prevAvgOrder),
      unitsSold: currentUnitsSold,
      unitsChange: calcPercentageChange(currentUnitsSold, prevUnitsSold),
    };

    // 2. Generate Time Series Data for Revenue & Orders Chart
    const timeBuckets = [];
    const bucketCount = timeRange === "yearly" ? 12 : days;

    for (let i = bucketCount - 1; i >= 0; i--) {
      const bucketDate = new Date(now);
      if (timeRange === "yearly") {
        bucketDate.setMonth(bucketDate.getMonth() - i);
      } else {
        bucketDate.setDate(bucketDate.getDate() - i);
      }

      const dateStr = bucketDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        ...(timeRange === "yearly" && { year: "numeric" }),
      });

      // Filter orders in this bucket
      const bucketOrders = validCurrentOrders.filter((o) => {
        const d = new Date(o.createdAt);
        if (timeRange === "yearly") {
          return d.getMonth() === bucketDate.getMonth() && d.getFullYear() === bucketDate.getFullYear();
        }
        return d.toDateString() === bucketDate.toDateString();
      });

      const revenue = bucketOrders.reduce((sum, o) => sum + Number(o.total || 0), 0);
      timeBuckets.push({
        date: dateStr,
        fullDate: bucketDate,
        revenue: Math.round(revenue),
        orders: bucketOrders.length,
      });
    }

    // 3. Order Status Distribution
    const statusCounts = {
      Completed: 0,
      Ready: 0,
      Preparing: 0,
      Confirmed: 0,
      Pending: 0,
      Cancelled: 0,
    };

    currentOrders.forEach((o) => {
      const key = o.status.charAt(0) + o.status.slice(1).toLowerCase();
      if (statusCounts[key] !== undefined) {
        statusCounts[key] += 1;
      }
    });

    const orderStatus = Object.keys(statusCounts).map((name) => ({
      name,
      value: statusCounts[name],
    }));

    // 4. Top Menu Items (by quantity sold in current period)
    const menuItemSalesMap = {};
    validCurrentOrders.forEach((o) => {
      o.items.forEach((item) => {
        const name = item.name;
        menuItemSalesMap[name] = (menuItemSalesMap[name] || 0) + item.quantity;
      });
    });

    const topProducts = Object.entries(menuItemSalesMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // 5. Category Performance (revenue per category)
    const categoriesWithItems = await prisma.category.findMany({
      where: { businessId },
      include: {
        menuItems: {
          include: {
            orderItems: {
              where: {
                order: {
                  businessId,
                  createdAt: { gte: currentStart, lte: now },
                  status: { not: "CANCELLED" },
                },
              },
            },
          },
        },
      },
    });

    const categoryPerformance = categoriesWithItems
      .map((cat) => {
        const catRevenue = cat.menuItems.reduce((cSum, mItem) => {
          const itemRev = mItem.orderItems.reduce((iSum, oItem) => iSum + Number(oItem.subtotal || 0), 0);
          return cSum + itemRev;
        }, 0);
        return { name: cat.name, value: Math.round(catRevenue) };
      })
      .filter((c) => c.value > 0)
      .sort((a, b) => b.value - a.value);

    // 6. Deal Performance
    const dealsWithSales = await prisma.deal.findMany({
      where: { businessId },
      include: {
        orderItems: {
          where: {
            order: {
              businessId,
              createdAt: { gte: currentStart, lte: now },
              status: { not: "CANCELLED" },
            },
          },
        },
      },
    });

    const dealPerformance = dealsWithSales
      .map((deal) => {
        const totalSold = deal.orderItems.reduce((sum, item) => sum + item.quantity, 0);
        return { name: deal.name, value: totalSold };
      })
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value);

    // 7. Menu Analytics (replaces Inventory)
    const [totalMenuItems, availableCount, unavailableCount, recentMenuItems] = await Promise.all([
      prisma.menuItem.count({ where: { businessId } }),
      prisma.menuItem.count({ where: { businessId, status: "AVAILABLE" } }),
      prisma.menuItem.count({ where: { businessId, status: "UNAVAILABLE" } }),
      prisma.menuItem.findMany({
        where: { businessId },
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { category: true },
      }),
    ]);

    const inventory = {
      total: totalMenuItems,
      lowStock: availableCount,
      outOfStock: unavailableCount,
      items: recentMenuItems.map((item) => ({
        id: item.id,
        name: item.name,
        stock: `Rs. ${Number(item.sellingPrice).toLocaleString()}`,
        status: item.status === "AVAILABLE" ? "In Stock" : "Out of Stock",
      })),
    };

    return res.status(200).json({
      success: true,
      data: {
        overview,
        revenueOrders: timeBuckets,
        orderStatus,
        topProducts: topProducts.length > 0 ? topProducts : [{ name: "No items sold yet", value: 0 }],
        categoryPerformance: categoryPerformance.length > 0 ? categoryPerformance : [{ name: "General", value: 0 }],
        dealPerformance: dealPerformance.length > 0 ? dealPerformance : [{ name: "No active deals sold", value: 0 }],
        inventory,
      },
    });
  } catch (error) {
    console.error("getBusinessAnalytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business analytics",
      error: error.message,
    });
  }
};

// ============================================================
// AI ANALYTICS CONTROLLER
// ============================================================
export const getAiAnalytics = async (req, res) => {
  try {
    const { timeRange = "weekly" } = req.query;
    const { now, days, currentStart, prevStart } = getDateRanges(timeRange);
    const businessId = req.businessId;

    // 1. Fetch Conversations in current & previous periods
    const [currentConvs, prevConvs, currentOrders] = await Promise.all([
      prisma.conversation.findMany({
        where: {
          businessId,
          createdAt: { gte: currentStart, lte: now },
        },
      }),
      prisma.conversation.findMany({
        where: {
          businessId,
          createdAt: { gte: prevStart, lt: currentStart },
        },
      }),
      prisma.order.findMany({
        where: {
          businessId,
          createdAt: { gte: currentStart, lte: now },
          status: { not: "CANCELLED" },
        },
      }),
    ]);

    const totalConversations = currentConvs.length;
    const prevTotalConversations = prevConvs.length;

    const aiResolved = currentConvs.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;
    const prevAiResolved = prevConvs.filter((c) => c.status === "RESOLVED" || c.status === "CLOSED").length;

    // AI Orders: Orders associated with customers having conversations
    const customerIdsWithConversations = new Set(currentConvs.map((c) => c.customerId));
    const aiOrders = currentOrders.filter((o) => customerIdsWithConversations.has(o.customerId)).length;

    const resolutionRate = totalConversations > 0 ? Number(((aiResolved / totalConversations) * 100).toFixed(1)) : 0;
    const prevResolutionRate = prevTotalConversations > 0 ? Number(((prevAiResolved / prevTotalConversations) * 100).toFixed(1)) : 0;

    const aiOverview = {
      totalConversations,
      totalChange: calcPercentageChange(totalConversations, prevTotalConversations),
      aiResolved,
      resolvedChange: calcPercentageChange(aiResolved, prevAiResolved),
      aiOrders,
      ordersChange: calcPercentageChange(aiOrders, 0),
      resolutionRate,
      rateChange: Number((resolutionRate - prevResolutionRate).toFixed(1)),
    };

    // 2. Time series data for conversation volume
    const conversationVolume = [];
    const aiVsManual = [];

    const bucketCount = timeRange === "yearly" ? 12 : days;

    for (let i = bucketCount - 1; i >= 0; i--) {
      const bucketDate = new Date(now);
      if (timeRange === "yearly") {
        bucketDate.setMonth(bucketDate.getMonth() - i);
      } else {
        bucketDate.setDate(bucketDate.getDate() - i);
      }

      const dateStr = bucketDate.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        ...(timeRange === "yearly" && { year: "numeric" }),
      });

      const bucketConvs = currentConvs.filter((c) => {
        const d = new Date(c.createdAt);
        if (timeRange === "yearly") {
          return d.getMonth() === bucketDate.getMonth() && d.getFullYear() === bucketDate.getFullYear();
        }
        return d.toDateString() === bucketDate.toDateString();
      });

      const bucketOrders = currentOrders.filter((o) => {
        const d = new Date(o.createdAt);
        if (timeRange === "yearly") {
          return d.getMonth() === bucketDate.getMonth() && d.getFullYear() === bucketDate.getFullYear();
        }
        return d.toDateString() === bucketDate.toDateString();
      });

      const bucketAiOrders = bucketOrders.filter((o) => customerIdsWithConversations.has(o.customerId)).length;

      conversationVolume.push({
        date: dateStr,
        fullDate: bucketDate,
        conversations: bucketConvs.length,
      });

      aiVsManual.push({
        date: dateStr,
        fullDate: bucketDate,
        ai: bucketAiOrders,
        manual: bucketOrders.length - bucketAiOrders,
      });
    }

    // 3. Intent Distribution
    const intentCounts = {};
    currentConvs.forEach((c) => {
      const intentName = c.intent || "General Inquiry";
      intentCounts[intentName] = (intentCounts[intentName] || 0) + 1;
    });

    const intentDistribution = Object.entries(intentCounts).map(([name, value]) => ({
      key: name.toLowerCase().replace(/ /g, "_"),
      name,
      value,
    }));

    // 4. Agent Usage & Performance Table
    const agentStats = {
      GENERAL_AGENT: { name: "General Agent", conversations: 0, resolved: 0 },
      ORDER_AGENT: { name: "Order Agent", conversations: 0, resolved: 0 },
      SUPPORT_AGENT: { name: "Support Agent", conversations: 0, resolved: 0 },
      RESERVATION_AGENT: { name: "Reservation Agent", conversations: 0, resolved: 0 },
    };

    currentConvs.forEach((c) => {
      const agentKey = c.agent || "GENERAL_AGENT";
      if (agentStats[agentKey]) {
        agentStats[agentKey].conversations += 1;
        if (c.status === "RESOLVED" || c.status === "CLOSED") {
          agentStats[agentKey].resolved += 1;
        }
      }
    });

    const agentUsage = Object.values(agentStats).map((a) => ({
      name: a.name,
      value: a.conversations,
    }));

    const agentPerformance = Object.values(agentStats).map((a) => {
      const resolution = a.conversations > 0 ? Number(((a.resolved / a.conversations) * 100).toFixed(1)) : 100;
      return {
        agent: a.name,
        conversations: a.conversations,
        resolved: a.resolved,
        resolution,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        aiOverview,
        conversationVolume,
        intentDistribution: intentDistribution.length > 0 ? intentDistribution : [{ key: "general", name: "General Inquiry", value: 0 }],
        agentUsage,
        aiVsManual,
        agentPerformance,
      },
    });
  } catch (error) {
    console.error("getAiAnalytics error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch AI analytics",
      error: error.message,
    });
  }
};
