import prisma from "../config/prisma.js";

// Helper to calculate date ranges based on timeRange
const getDateRanges = (timeRange) => {
  const now = new Date();
  const rangeEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  let days = 7;
  if (timeRange === "monthly") days = 30;
  if (timeRange === "yearly") days = 365;

  const currentStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (days - 1), 0, 0, 0, 0);

  const prevStart = new Date(currentStart);
  if (timeRange === "yearly") {
    prevStart.setFullYear(prevStart.getFullYear() - 1);
  } else {
    prevStart.setDate(prevStart.getDate() - days);
  }

  return { now: rangeEnd, days, currentStart, prevStart };
};

// Helper to compute percentage change
const calcPercentageChange = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  const change = ((current - previous) / previous) * 100;
  return Number(change.toFixed(1));
};

const INTENT_DISPLAY_NAMES = {
  FOOD_INFORMATION: "Food Variety",
  PAYMENT_INFORMATION: "Payment Methods",
  DELIVERY_INFORMATION: "Delivery Info",
  BUSINESS_HOURS: "Opening Hours",
  BUSINESS_INFORMATION: "Restaurant Info",
  MENU_SEARCH: "Menu Search",
  MENU_ITEM_INFORMATION: "Dish Info",
  MENU_AVAILABILITY: "Menu Availability",
  DEAL_SEARCH: "Deals & Combos",
  CREATE_ORDER: "Place Order",
  GET_ORDER: "Track Order",
  CANCEL_ORDER: "Cancel Order",
  CUSTOMER_ORDERS: "Order History",
  GREETING: "Greeting",
  SUPPORT: "Customer Support",
  CHECK_RESERVATION_AVAILABILITY: "Check Reservation",
  CREATE_RESERVATION: "Book Table",
  GET_RESERVATION: "Reservation Status",
  GENERAL_QUERY: "General Inquiry",
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
        include: {
          items: {
            include: {
              menuItem: { include: { category: true } },
              deal: {
                include: {
                  items: {
                    include: {
                      menuItem: { include: { category: true } },
                    },
                  },
                },
              },
            },
          },
        },
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
      "Out for Delivery": 0,
      Preparing: 0,
      Confirmed: 0,
      Pending: 0,
      Cancelled: 0,
    };

    currentOrders.forEach((o) => {
      let key = o.status;
      if (key === "OUT_FOR_DELIVERY" || key === "out_for_delivery") {
        key = "Out for Delivery";
      } else {
        key = o.status.charAt(0) + o.status.slice(1).toLowerCase();
      }
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

    // 5. Category Performance (revenue per category derived from real orders & deal items)
    const allCategories = await prisma.category.findMany({
      where: { businessId },
      orderBy: { name: "asc" },
    });

    const categoryRevenueMap = {};
    allCategories.forEach((cat) => {
      categoryRevenueMap[cat.name] = 0;
    });

    validCurrentOrders.forEach((order) => {
      order.items.forEach((item) => {
        const itemSubtotal = Number(item.subtotal || 0);

        if (item.menuItem?.category?.name) {
          const catName = item.menuItem.category.name;
          categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + itemSubtotal;
        } else if (item.deal?.items?.length) {
          const validDealItems = item.deal.items.filter((di) => di.menuItem?.category?.name);
          if (validDealItems.length > 0) {
            const splitShare = itemSubtotal / validDealItems.length;
            validDealItems.forEach((di) => {
              const catName = di.menuItem.category.name;
              categoryRevenueMap[catName] = (categoryRevenueMap[catName] || 0) + splitShare;
            });
          }
        }
      });
    });

    const categoryPerformance = allCategories
      .map((cat) => ({
        name: cat.name,
        value: Math.round(categoryRevenueMap[cat.name] || 0),
      }))
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
        categoryPerformance:
          categoryPerformance.length > 0 ? categoryPerformance : [{ name: "General", value: 0 }],
        dealPerformance:
          dealPerformance.length > 0 ? dealPerformance : [{ name: "No active deals sold", value: 0 }],
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

// Helper for exact integer percentage calculation using Largest Remainder Method (Hare-Niemeyer)
const calculateExactDistribution = (rawCounts, displayNames = INTENT_DISPLAY_NAMES) => {
  const total = Object.values(rawCounts).reduce((a, b) => a + b, 0);
  if (total === 0) {
    return [{ key: "general_query", name: "General Inquiry", value: 100 }];
  }

  const items = Object.entries(rawCounts).map(([rawKey, count]) => {
    const exact = (count / total) * 100;
    const integer = Math.floor(exact);
    const remainder = exact - integer;
    const displayName = displayNames[rawKey] || rawKey.replace(/_/g, " ");
    return {
      key: rawKey.toLowerCase(),
      rawKey,
      name: displayName,
      count,
      exact,
      integer,
      remainder,
    };
  });

  const sumInteger = items.reduce((sum, item) => sum + item.integer, 0);
  let difference = 100 - sumInteger;

  // Sort by remainder descending to distribute remaining units
  const sortedByRemainder = [...items].sort((a, b) => b.remainder - a.remainder);
  for (let i = 0; i < difference; i++) {
    sortedByRemainder[i % sortedByRemainder.length].integer += 1;
  }

  return items
    .map((item) => ({
      key: item.key,
      name: item.name,
      value: item.integer,
    }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
};

// Helper to determine if a conversation required human escalation
const isConversationEscalated = (conv) => {
  if (!conv) return false;
  if (conv.status === "ESCALATED") return true;
  if (Boolean(conv.escalationReason)) return true;
  if (Boolean(conv.resolvedByName)) return true;
  if (conv.messages && Array.isArray(conv.messages)) {
    if (conv.messages.some((m) => m.isHuman)) return true;
  }
  return false;
};

// ============================================================
// AI ANALYTICS CONTROLLER
// ============================================================
export const getAiAnalytics = async (req, res) => {
  try {
    const { timeRange = "weekly" } = req.query;
    const { now, days, currentStart, prevStart } = getDateRanges(timeRange);
    const businessId = req.businessId;

    // 1. Fetch Conversations, AgentRuns, and Orders in current & previous periods
    const [currentConvs, prevConvs, currentRuns, prevRuns, currentOrders, prevOrders] =
      await Promise.all([
        prisma.conversation.findMany({
          where: {
            businessId,
            createdAt: { gte: currentStart, lte: now },
          },
          include: {
            messages: { select: { isHuman: true } },
            agentRuns: { select: { id: true, agent: true } },
          },
        }),
        prisma.conversation.findMany({
          where: {
            businessId,
            createdAt: { gte: prevStart, lt: currentStart },
          },
          include: {
            messages: { select: { isHuman: true } },
            agentRuns: { select: { id: true, agent: true } },
          },
        }),
        prisma.agentRun.findMany({
          where: {
            businessId,
            startedAt: { gte: currentStart, lte: now },
          },
          include: { toolExecutions: true },
        }),
        prisma.agentRun.findMany({
          where: {
            businessId,
            startedAt: { gte: prevStart, lt: currentStart },
          },
          include: { toolExecutions: true },
        }),
        prisma.order.findMany({
          where: {
            businessId,
            createdAt: { gte: currentStart, lte: now },
          },
          include: { customer: true },
        }),
        prisma.order.findMany({
          where: {
            businessId,
            createdAt: { gte: prevStart, lt: currentStart },
          },
          include: { customer: true },
        }),
      ]);

    const totalConversations = currentConvs.length;
    const prevTotalConversations = prevConvs.length;

    // AI Resolved: conversations handled by AI without escalation to human staff
    const currentEscalations = currentConvs.filter(isConversationEscalated).length;
    const aiResolved = Math.max(0, totalConversations - currentEscalations);

    const prevEscalations = prevConvs.filter(isConversationEscalated).length;
    const prevAiResolved = Math.max(0, prevTotalConversations - prevEscalations);

    // AI Orders Attribution
    const currentAiOrderIds = new Set();
    const currentAiOrderNumbers = new Set();

    currentRuns.forEach((r) => {
      (r.toolExecutions || []).forEach((t) => {
        if (t.toolName === "createOrder" && t.output && typeof t.output === "object") {
          if (t.output.orderId) currentAiOrderIds.add(t.output.orderId);
          if (t.output.orderNumber) currentAiOrderNumbers.add(t.output.orderNumber);
        }
      });
    });

    currentOrders.forEach((o) => {
      if (o.conversationId) {
        currentAiOrderIds.add(o.id);
        currentAiOrderNumbers.add(o.orderNumber);
      }
    });

    const isCurrentAiOrder = (order) => {
      if (!order) return false;
      if (order.conversationId) return true;
      if (currentAiOrderIds.has(order.id) || currentAiOrderNumbers.has(order.orderNumber)) return true;
      return false;
    };

    const validCurrentOrders = currentOrders.filter((o) => o.status !== "CANCELLED");
    const aiOrders = validCurrentOrders.filter(isCurrentAiOrder).length;

    const prevAiOrderIds = new Set();
    const prevAiOrderNumbers = new Set();
    prevRuns.forEach((r) => {
      (r.toolExecutions || []).forEach((t) => {
        if (t.toolName === "createOrder" && t.output && typeof t.output === "object") {
          if (t.output.orderId) prevAiOrderIds.add(t.output.orderId);
          if (t.output.orderNumber) prevAiOrderNumbers.add(t.output.orderNumber);
        }
      });
    });
    prevOrders.forEach((o) => {
      if (o.conversationId) {
        prevAiOrderIds.add(o.id);
        prevAiOrderNumbers.add(o.orderNumber);
      }
    });

    const isPrevAiOrder = (order) => {
      if (!order) return false;
      if (order.conversationId) return true;
      if (prevAiOrderIds.has(order.id) || prevAiOrderNumbers.has(order.orderNumber)) return true;
      return false;
    };

    const validPrevOrders = prevOrders.filter((o) => o.status !== "CANCELLED");
    const prevAiOrders = validPrevOrders.filter(isPrevAiOrder).length;

    // AI Resolution Rate
    const resolutionRate =
      totalConversations > 0 ? Number(((aiResolved / totalConversations) * 100).toFixed(1)) : 0;
    const prevResolutionRate =
      prevTotalConversations > 0
        ? Number(((prevAiResolved / prevTotalConversations) * 100).toFixed(1))
        : 0;

    const aiOverview = {
      totalConversations,
      totalChange: calcPercentageChange(totalConversations, prevTotalConversations),
      aiResolved,
      resolvedChange: calcPercentageChange(aiResolved, prevAiResolved),
      aiOrders,
      ordersChange: calcPercentageChange(aiOrders, prevAiOrders),
      resolutionRate,
      rateChange: Number((resolutionRate - prevResolutionRate).toFixed(1)),
    };

    // 2. Time series data for conversation volume & AI vs Manual
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
          return (
            d.getMonth() === bucketDate.getMonth() && d.getFullYear() === bucketDate.getFullYear()
          );
        }
        return d.toDateString() === bucketDate.toDateString();
      });

      const bucketOrders = validCurrentOrders.filter((o) => {
        const d = new Date(o.createdAt);
        if (timeRange === "yearly") {
          return (
            d.getMonth() === bucketDate.getMonth() && d.getFullYear() === bucketDate.getFullYear()
          );
        }
        return d.toDateString() === bucketDate.toDateString();
      });

      const bucketAiOrders = bucketOrders.filter(isCurrentAiOrder).length;

      conversationVolume.push({
        date: dateStr,
        fullDate: bucketDate,
        conversations: bucketConvs.length,
      });

      aiVsManual.push({
        date: dateStr,
        fullDate: bucketDate,
        ai: bucketAiOrders,
        manual: Math.max(0, bucketOrders.length - bucketAiOrders),
      });
    }

    // 3. Intent Distribution (exact 100% normalized)
    const intentCounts = {};

    currentRuns.forEach((r) => {
      let intentKey = "GENERAL_QUERY";
      const toolNames = (r.toolExecutions || []).map((t) => t.toolName);

      if (toolNames.includes("createOrder")) intentKey = "CREATE_ORDER";
      else if (toolNames.includes("getOrder")) intentKey = "GET_ORDER";
      else if (toolNames.includes("cancelOrder")) intentKey = "CANCEL_ORDER";
      else if (toolNames.includes("searchMenu") || toolNames.includes("getMenuItem")) intentKey = "MENU_SEARCH";
      else if (toolNames.includes("searchDeals") || toolNames.includes("getDeal")) intentKey = "DEAL_SEARCH";
      else if (toolNames.includes("getBusinessHours")) intentKey = "BUSINESS_HOURS";
      else if (toolNames.includes("searchKnowledgeBase")) intentKey = "FOOD_INFORMATION";
      else if (r.agent === "ORDER_AGENT") intentKey = "MENU_SEARCH";
      else if (r.agent === "SUPPORT_AGENT") intentKey = "SUPPORT";
      else if (r.agent === "RESERVATION_AGENT") intentKey = "CHECK_RESERVATION_AVAILABILITY";

      intentCounts[intentKey] = (intentCounts[intentKey] || 0) + 1;
    });

    if (Object.keys(intentCounts).length === 0) {
      currentConvs.forEach((c) => {
        const intentKey = c.intent || "GENERAL_QUERY";
        intentCounts[intentKey] = (intentCounts[intentKey] || 0) + 1;
      });
    }

    const intentDistribution = calculateExactDistribution(intentCounts);

    // 4. Agent Usage
    const AGENT_DEFINITIONS = [
      { key: "GENERAL_AGENT", name: "General Agent" },
      { key: "ORDER_AGENT", name: "Order Agent" },
      { key: "SUPPORT_AGENT", name: "Support Agent" },
      { key: "RESERVATION_AGENT", name: "Reservation Agent" },
    ];

    const agentRunCounts = {
      GENERAL_AGENT: 0,
      ORDER_AGENT: 0,
      SUPPORT_AGENT: 0,
      RESERVATION_AGENT: 0,
    };

    currentRuns.forEach((r) => {
      const agentKey = r.agent || "GENERAL_AGENT";
      if (agentRunCounts[agentKey] !== undefined) {
        agentRunCounts[agentKey] += 1;
      }
    });

    if (currentRuns.length === 0) {
      currentConvs.forEach((c) => {
        const agentKey = c.agent || "GENERAL_AGENT";
        if (agentRunCounts[agentKey] !== undefined) {
          agentRunCounts[agentKey] += 1;
        }
      });
    }

    const agentUsage = AGENT_DEFINITIONS.map(({ key, name }) => ({
      name,
      value: agentRunCounts[key] || 0,
    }));

    // 5. Agent Performance Table
    const agentPerformance = AGENT_DEFINITIONS.map(({ key, name }) => {
      const convsForAgent = currentConvs.filter((c) => {
        const hasRun = (c.agentRuns || []).some((r) => r.agent === key);
        const isPrimary = c.agent === key;
        return hasRun || isPrimary;
      });

      const count = convsForAgent.length;
      const resolvedCount = convsForAgent.filter((c) => !isConversationEscalated(c)).length;
      const resolution = count > 0 ? Number(((resolvedCount / count) * 100).toFixed(1)) : 100;

      return {
        agent: name,
        conversations: count,
        resolved: resolvedCount,
        resolution,
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        aiOverview,
        conversationVolume,
        intentDistribution,
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
