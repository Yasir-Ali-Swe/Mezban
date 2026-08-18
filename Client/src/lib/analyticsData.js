// Helper to generate realistic time-series data
const generateWeeklyData = (baseValue, variance, startOffset = 0) => {
  const data = [];
  const dates = [];
  const today = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i - startOffset);
    dates.push(d);
  }

  dates.forEach((date, index) => {
    const variation = (Math.sin(index * 0.8) * 0.3 + 0.7) * variance;
    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      }),
      fullDate: date,
    });
  });

  return data;
};

const generateMonthlyData = (baseValue, variance, startOffset = 0) => {
  const data = [];
  const dates = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i - startOffset);
    dates.push(d);
  }

  dates.forEach((date, index) => {
    const variation = (Math.sin(index * 0.3) * 0.3 + 0.7) * variance;
    data.push({
      date: date.toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
      }),
      fullDate: date,
    });
  });

  return data;
};

const generateYearlyData = (baseValue, variance) => {
  const data = [];
  const today = new Date();

  for (let i = 11; i >= 0; i--) {
    const d = new Date(today);
    d.setMonth(d.getMonth() - i);
    data.push({
      date: d.toLocaleDateString("en-US", { month: "short", year: "numeric" }),
      fullDate: d,
    });
  }

  return data;
};

// Generate all datasets
const weeklyData = generateWeeklyData(0, 0);
const monthlyData = generateMonthlyData(0, 0);
const yearlyData = generateYearlyData(0, 0);

// Revenue & Orders Data
const weeklyRevenueOrders = generateWeeklyData(0, 0).map((item, index) => ({
  ...item,
  revenue: Math.round(15000 + Math.sin(index * 0.7) * 5000 + index * 1000),
  orders: Math.round(30 + Math.sin(index * 0.7) * 10 + index * 2),
}));

const monthlyRevenueOrders = generateMonthlyData(0, 0).map((item, index) => ({
  ...item,
  revenue: Math.round(12000 + Math.sin(index * 0.3) * 4000 + index * 500),
  orders: Math.round(25 + Math.sin(index * 0.3) * 8 + index * 1.5),
}));

const yearlyRevenueOrders = generateYearlyData(0, 0).map((item, index) => ({
  ...item,
  revenue: Math.round(200000 + Math.sin(index * 0.5) * 50000 + index * 15000),
  orders: Math.round(400 + Math.sin(index * 0.5) * 100 + index * 30),
}));

// Conversation Volume Data
const weeklyConversations = generateWeeklyData(0, 0).map((item, index) => ({
  ...item,
  conversations: Math.round(120 + Math.sin(index * 0.6) * 40 + index * 5),
}));

const monthlyConversations = generateMonthlyData(0, 0).map((item, index) => ({
  ...item,
  conversations: Math.round(100 + Math.sin(index * 0.3) * 30 + index * 3),
}));

const yearlyConversations = generateYearlyData(0, 0).map((item, index) => ({
  ...item,
  conversations: Math.round(2000 + Math.sin(index * 0.5) * 500 + index * 150),
}));

// AI vs Manual Data
const weeklyAIVsManual = generateWeeklyData(0, 0).map((item, index) => ({
  ...item,
  manual: Math.round(15 + Math.sin(index * 0.7) * 5 + index * 1),
  ai: Math.round(25 + Math.sin(index * 0.7) * 8 + index * 2),
}));

const monthlyAIVsManual = generateMonthlyData(0, 0).map((item, index) => ({
  ...item,
  manual: Math.round(12 + Math.sin(index * 0.3) * 4 + index * 0.8),
  ai: Math.round(20 + Math.sin(index * 0.3) * 6 + index * 1.2),
}));

const yearlyAIVsManual = generateYearlyData(0, 0).map((item, index) => ({
  ...item,
  manual: Math.round(200 + Math.sin(index * 0.5) * 50 + index * 15),
  ai: Math.round(350 + Math.sin(index * 0.5) * 80 + index * 25),
}));

// Categorical Data
const orderStatusCategories = [
  "Completed",
  "Ready",
  "Preparing",
  "Confirmed",
  "Pending",
  "Cancelled",
];

const generateOrderStatus = (total, distribution) => {
  return orderStatusCategories.map((name, index) => ({
    name,
    value: Math.round(total * (distribution[index] || 0.1)),
  }));
};

const intentCategories = [
  "Menu Search",
  "Place Order",
  "Order Status",
  "Menu Info",
  "Support",
];

const generateIntentDistribution = (total, distribution) => {
  return intentCategories.map((name, index) => ({
    key: name.toLowerCase().replace(/ /g, ""),
    name,
    value: Math.round(total * distribution[index]),
  }));
};

const agentCategories = ["Menu Agent", "Order Agent", "Support Agent"];

const generateAgentUsage = (total, distribution) => {
  return agentCategories.map((name, index) => ({
    name,
    value: Math.round(total * distribution[index]),
  }));
};

const productCategories = [
  "Chicken Karahi",
  "Mutton Karahi",
  "Chicken Biryani",
  "Garlic Naan",
  "Mango Lassi",
];

const generateTopProducts = (total, distribution) => {
  return productCategories.map((name, index) => ({
    name,
    value: Math.round(total * distribution[index]),
  }));
};

const categoryCategories = [
  "Main Course",
  "BBQ",
  "Rice",
  "Breads",
  "Beverages",
];

const generateCategoryPerformance = (total, distribution) => {
  return categoryCategories.map((name, index) => ({
    name,
    value: Math.round(total * distribution[index]),
  }));
};

const dealCategories = [
  "Family Feast",
  "Student Combo",
  "Burger Combo",
  "BBQ Family Deal",
];

const generateDealPerformance = (total, distribution) => {
  return dealCategories.map((name, index) => ({
    name,
    value: Math.round(total * distribution[index]),
  }));
};

// Agent Performance Data
const agentPerformanceCategories = [
  "Menu Agent",
  "Order Agent",
  "Support Agent",
];

const generateAgentPerformance = (baseConversations, baseResolved) => {
  return agentPerformanceCategories.map((agent, index) => {
    const conv = Math.round(baseConversations * (0.8 + index * 0.3));
    const res = Math.round(baseResolved * (0.75 + index * 0.35));
    return {
      agent,
      conversations: conv,
      resolved: res,
      resolution: Math.round((res / conv) * 1000) / 10,
    };
  });
};

// Complete Analytics Data
export const ANALYTICS_DATA = {
  weekly: {
    // Overview Cards
    overview: {
      revenue: 485200,
      revenueChange: 12.4,
      orders: 324,
      ordersChange: 8.2,
      avgOrderValue: 1497,
      avgOrderChange: 3.8,
      unitsSold: 582,
      unitsChange: 15.6,
    },
    // AI Overview
    aiOverview: {
      totalConversations: 1248,
      totalChange: 12.4,
      aiResolved: 1084,
      resolvedChange: 8.2,
      aiOrders: 286,
      ordersChange: 15.6,
      resolutionRate: 86.8,
      rateChange: 2.4,
    },
    // Time-series data (7 days)
    revenueOrders: weeklyRevenueOrders,
    conversationVolume: weeklyConversations,
    aiVsManual: weeklyAIVsManual,
    // Categorical data
    orderStatus: generateOrderStatus(300, [0.65, 0.12, 0.08, 0.09, 0.06]),
    intentDistribution: generateIntentDistribution(
      100,
      [0.35, 0.28, 0.18, 0.12, 0.07],
    ),
    agentUsage: generateAgentUsage(1000, [0.42, 0.32, 0.26]),
    topProducts: generateTopProducts(350, [0.28, 0.24, 0.2, 0.16, 0.12]),
    categoryPerformance: generateCategoryPerformance(
      500000,
      [0.32, 0.25, 0.2, 0.14, 0.09],
    ),
    dealPerformance: generateDealPerformance(300, [0.32, 0.28, 0.22, 0.18]),
    // Agent Performance
    agentPerformance: generateAgentPerformance(350, 300),
    // Inventory
    inventory: {
      total: 142,
      lowStock: 8,
      outOfStock: 3,
      items: [
        { name: "Chicken Karahi (Half)", stock: 4, status: "Low" },
        { name: "Garlic Naan", stock: 2, status: "Low" },
        { name: "Mutton Karahi (Full)", stock: 0, status: "Out of Stock" },
        { name: "Mango Lassi", stock: 1, status: "Low" },
        { name: "Fresh Lime", stock: 0, status: "Out of Stock" },
      ],
    },
  },
  monthly: {
    // Overview Cards
    overview: {
      revenue: 1852000,
      revenueChange: 15.8,
      orders: 1280,
      ordersChange: 10.5,
      avgOrderValue: 1447,
      avgOrderChange: 4.2,
      unitsSold: 2250,
      unitsChange: 18.3,
    },
    // AI Overview
    aiOverview: {
      totalConversations: 4850,
      totalChange: 14.2,
      aiResolved: 4210,
      resolvedChange: 9.8,
      aiOrders: 1120,
      ordersChange: 18.5,
      resolutionRate: 86.8,
      rateChange: 2.4,
    },
    // Time-series data (30 days - will be aggregated to 15)
    revenueOrders: monthlyRevenueOrders,
    conversationVolume: monthlyConversations,
    aiVsManual: monthlyAIVsManual,
    // Categorical data
    orderStatus: generateOrderStatus(1200, [0.62, 0.14, 0.09, 0.08, 0.07]),
    intentDistribution: generateIntentDistribution(
      100,
      [0.33, 0.3, 0.17, 0.11, 0.09],
    ),
    agentUsage: generateAgentUsage(4000, [0.4, 0.33, 0.27]),
    topProducts: generateTopProducts(1400, [0.27, 0.25, 0.2, 0.16, 0.12]),
    categoryPerformance: generateCategoryPerformance(
      2000000,
      [0.3, 0.26, 0.2, 0.14, 0.1],
    ),
    dealPerformance: generateDealPerformance(1200, [0.3, 0.28, 0.22, 0.2]),
    // Agent Performance
    agentPerformance: generateAgentPerformance(1400, 1200),
    // Inventory
    inventory: {
      total: 142,
      lowStock: 8,
      outOfStock: 3,
      items: [
        { name: "Chicken Karahi (Half)", stock: 4, status: "Low" },
        { name: "Garlic Naan", stock: 2, status: "Low" },
        { name: "Mutton Karahi (Full)", stock: 0, status: "Out of Stock" },
        { name: "Mango Lassi", stock: 1, status: "Low" },
        { name: "Fresh Lime", stock: 0, status: "Out of Stock" },
      ],
    },
  },
  yearly: {
    // Overview Cards
    overview: {
      revenue: 22450000,
      revenueChange: 22.4,
      orders: 15200,
      ordersChange: 18.6,
      avgOrderValue: 1477,
      avgOrderChange: 5.2,
      unitsSold: 27500,
      unitsChange: 25.8,
    },
    // AI Overview
    aiOverview: {
      totalConversations: 58200,
      totalChange: 20.8,
      aiResolved: 50500,
      resolvedChange: 18.5,
      aiOrders: 13400,
      ordersChange: 24.2,
      resolutionRate: 86.8,
      rateChange: 2.4,
    },
    // Time-series data (12 months)
    revenueOrders: yearlyRevenueOrders,
    conversationVolume: yearlyConversations,
    aiVsManual: yearlyAIVsManual,
    // Categorical data
    orderStatus: generateOrderStatus(15000, [0.6, 0.15, 0.1, 0.08, 0.07]),
    intentDistribution: generateIntentDistribution(
      100,
      [0.32, 0.3, 0.18, 0.11, 0.09],
    ),
    agentUsage: generateAgentUsage(50000, [0.38, 0.34, 0.28]),
    topProducts: generateTopProducts(17000, [0.26, 0.25, 0.21, 0.16, 0.12]),
    categoryPerformance: generateCategoryPerformance(
      24000000,
      [0.28, 0.27, 0.2, 0.14, 0.11],
    ),
    dealPerformance: generateDealPerformance(14500, [0.28, 0.27, 0.24, 0.21]),
    // Agent Performance
    agentPerformance: generateAgentPerformance(17000, 14500),
    // Inventory
    inventory: {
      total: 142,
      lowStock: 8,
      outOfStock: 3,
      items: [
        { name: "Chicken Karahi (Half)", stock: 4, status: "Low" },
        { name: "Garlic Naan", stock: 2, status: "Low" },
        { name: "Mutton Karahi (Full)", stock: 0, status: "Out of Stock" },
        { name: "Mango Lassi", stock: 1, status: "Low" },
        { name: "Fresh Lime", stock: 0, status: "Out of Stock" },
      ],
    },
  },
};

export const getAnalyticsData = (timeRange) => {
  return ANALYTICS_DATA[timeRange] || ANALYTICS_DATA.weekly;
};
