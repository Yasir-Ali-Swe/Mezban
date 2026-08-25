import prisma from "./config/prisma.js";
import { getBusinessAnalytics, getAiAnalytics } from "./controllers/analytics.controller.js";
import { updateOrderStatus, getOrderById } from "./controllers/order.controller.js";
import { getConversationStats, getConversations, getConversationById, updateConversationStatus, sendConversationMessage } from "./controllers/conversation.controller.js";
import { createOrderTool } from "./ai/tools/orders/createOrder.tool.js";
import { cancelOrderTool } from "./ai/tools/orders/cancelOrder.tool.js";
import { searchMenuTool } from "./ai/tools/menu/searchMenu.tool.js";
import { searchDealsTool } from "./ai/tools/deals/searchDeals.tool.js";
import { escalateConversationTool } from "./ai/tools/support/escalateConversation.tool.js";

async function runRegressionTests() {
  console.log("============================================================");
  console.log("STARTING COMPLETE TELEAGENT REGRESSION & AUDIT SUITE");
  console.log("============================================================\n");

  const business = await prisma.business.findFirst({
    include: {
      categories: true,
      menuItems: true,
      deals: { include: { items: { include: { menuItem: true } } } },
    },
  });

  if (!business) {
    console.error("No business found in database for testing.");
    process.exit(1);
  }

  const businessId = business.id;
  console.log(`[Setup] Using Business: "${business.name}" (${businessId})\n`);

  let testsPassed = 0;
  let testsTotal = 0;

  function assert(condition, testName, extraInfo = "") {
    testsTotal++;
    if (condition) {
      console.log(`  ✓ PASS: ${testName} ${extraInfo ? `(${extraInfo})` : ""}`);
      testsPassed++;
    } else {
      console.error(`  ✗ FAIL: ${testName} ${extraInfo ? `(${extraInfo})` : ""}`);
    }
  }

  // ------------------------------------------------------------
  // 1. Menu & Deals Availability Rules
  // ------------------------------------------------------------
  console.log("1. TESTING MENU & DEAL AVAILABILITY RULES");
  const menuRes = await searchMenuTool.execute({ businessId });
  assert(menuRes.success === true, "searchMenu executes successfully");
  const allAvailable = (menuRes.items || []).every((i) => i.isAvailable && i.status === "AVAILABLE");
  assert(allAvailable, "searchMenu returns ONLY available items with active categories", `found ${menuRes.items?.length || 0} items`);

  const dealRes = await searchDealsTool.execute({ businessId });
  assert(dealRes.success === true, "searchDeals executes successfully");
  const allActiveDeals = (dealRes.deals || []).every((d) => d.status === "ACTIVE");
  assert(allActiveDeals, "searchDeals returns ONLY active deals", `found ${dealRes.deals?.length || 0} deals`);

  // ------------------------------------------------------------
  // 2. Customer Lookup or Creation
  // ------------------------------------------------------------
  console.log("\n2. TESTING CUSTOMER PERSISTENCE");
  let customer = await prisma.customer.findFirst({
    where: { businessId, telegramChatId: "99887766" },
  });

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        businessId,
        telegramChatId: "99887766",
        telegramUserId: "99887766",
        name: "Test Customer",
        phone: "0300-1122334",
      },
    });
  }
  assert(Boolean(customer?.id), "Customer profile retrieved or created", `CustomerId: ${customer.id}`);

  // ------------------------------------------------------------
  // 3. Conversational Order Placement & Payment Method
  // ------------------------------------------------------------
  console.log("\n3. TESTING ORDER PLACEMENT WITH PAYMENT METHOD");
  const firstMenuItem = business.menuItems.find((i) => i.status === "AVAILABLE") || business.menuItems[0];
  const orderRes = await createOrderTool.execute({
    businessId,
    customerId: customer.id,
    items: [{ name: firstMenuItem.name, quantity: 2, menuItemId: firstMenuItem.id }],
    orderType: "DELIVERY",
    paymentMethod: "Cash on Delivery",
    shippingAddress: "House 10, Street 5, D-Type Colony, Faisalabad",
    customerPhone: "0300-1122334",
    notes: "Please pack hot",
  });

  assert(orderRes.success === true, "createOrder succeeds with atomic transaction", `Order #${orderRes.orderNumber}`);
  assert(orderRes.paymentMethod === "Cash on Delivery", "Payment method persisted on order record");
  assert(orderRes.total === (Number(firstMenuItem.sellingPrice) * 2) + 150, "Order total correctly calculated from DB prices + shipping");

  // Verify order in database
  const createdOrder = await prisma.order.findFirst({
    where: { businessId, orderNumber: orderRes.orderNumber },
  });
  assert(createdOrder?.paymentMethod === "Cash on Delivery", "Database order record contains paymentMethod field");
  assert(createdOrder?.status === "PENDING", "Initial status is PENDING");

  // ------------------------------------------------------------
  // 4. Order Status Flow & Immutability Guards
  // ------------------------------------------------------------
  console.log("\n4. TESTING ORDER STATUS TRANSITIONS & IMMUTABILITY");

  // Transition PENDING -> CONFIRMED
  let mockRes = { status: (code) => ({ json: (d) => ({ code, data: d }) }) };
  let updateResult = await updateOrderStatus(
    { params: { id: createdOrder.id }, body: { status: "confirmed" }, businessId, app: { get: () => null } },
    { status: (code) => ({ json: (d) => ({ code, data: d }) }) }
  );
  assert(updateResult?.code === 200, "Transition PENDING -> CONFIRMED succeeds");

  // Transition CONFIRMED -> PREPARING
  updateResult = await updateOrderStatus(
    { params: { id: createdOrder.id }, body: { status: "preparing" }, businessId, app: { get: () => null } },
    { status: (code) => ({ json: (d) => ({ code, data: d }) }) }
  );
  assert(updateResult?.code === 200, "Transition CONFIRMED -> PREPARING succeeds");

  // Transition PREPARING -> OUT_FOR_DELIVERY
  updateResult = await updateOrderStatus(
    { params: { id: createdOrder.id }, body: { status: "out_for_delivery" }, businessId, app: { get: () => null } },
    { status: (code) => ({ json: (d) => ({ code, data: d }) }) }
  );
  assert(updateResult?.code === 200, "Transition PREPARING -> OUT_FOR_DELIVERY succeeds");

  // Transition OUT_FOR_DELIVERY -> COMPLETED
  updateResult = await updateOrderStatus(
    { params: { id: createdOrder.id }, body: { status: "completed" }, businessId, app: { get: () => null } },
    { status: (code) => ({ json: (d) => ({ code, data: d }) }) }
  );
  assert(updateResult?.code === 200, "Transition OUT_FOR_DELIVERY -> COMPLETED succeeds");

  // Terminal Guard: Attempting to transition COMPLETED -> PREPARING
  let terminalGuardBlocked = false;
  await updateOrderStatus(
    { params: { id: createdOrder.id }, body: { status: "preparing" }, businessId, app: { get: () => null } },
    { status: (code) => ({ json: (d) => { if (code === 400) terminalGuardBlocked = true; } }) }
  );
  assert(terminalGuardBlocked, "Terminal guard blocks transition from COMPLETED (HTTP 400)");

  // ------------------------------------------------------------
  // 5. Non-Pending Cancellation Escalation
  // ------------------------------------------------------------
  console.log("\n5. TESTING NON-PENDING CANCELLATION ESCALATION");

  // Create a new order and advance it to PREPARING
  const prepOrderRes = await createOrderTool.execute({
    businessId,
    customerId: customer.id,
    items: [{ name: firstMenuItem.name, quantity: 1, menuItemId: firstMenuItem.id }],
    orderType: "DELIVERY",
    paymentMethod: "JazzCash",
    shippingAddress: "Street 1, Lahore",
    customerPhone: "0300-1122334",
  });
  await prisma.order.update({
    where: { id: prepOrderRes.orderId },
    data: { status: "PREPARING" },
  });

  // Create a conversation for this customer
  let conversation = await prisma.conversation.create({
    data: {
      businessId,
      customerId: customer.id,
      status: "ACTIVE",
      intent: "ORDER_STATUS",
      agent: "ORDER_AGENT",
      lastMessage: "I want to cancel my order",
    },
  });

  // Attempt cancel on PREPARING order
  const cancelAttempt = await cancelOrderTool.execute({
    businessId,
    customerId: customer.id,
    conversationId: conversation.id,
    orderNumber: prepOrderRes.orderNumber,
  });

  assert(cancelAttempt.success === false, "AI rejects automatic cancellation on PREPARING order");
  assert(cancelAttempt.escalated === true, "Cancellation request triggers escalation flag");

  const escalatedConv = await prisma.conversation.findUnique({
    where: { id: conversation.id },
  });
  assert(escalatedConv.status === "ESCALATED", "Conversation status updated to ESCALATED in DB");

  // ------------------------------------------------------------
  // 6. Support Complaint Escalation Tool
  // ------------------------------------------------------------
  console.log("\n6. TESTING SUPPORT COMPLAINT WORKFLOW");
  const complaintEscalation = await escalateConversationTool.execute({
    businessId,
    conversationId: conversation.id,
    reason: "Customer complaint: Food was delivered cold",
    complaintDetails: "Delivery was 40 minutes late and soup spilled",
  });
  assert(complaintEscalation.success === true, "escalateConversation tool executes and records complaint");

  // ------------------------------------------------------------
  // 7. Human Staff Message Sending & Dispatch
  // ------------------------------------------------------------
  console.log("\n7. TESTING HUMAN MESSAGE DISPATCH");
  let sentMsgData = null;
  await sendConversationMessage(
    {
      businessId,
      params: { id: conversation.id },
      body: { content: "Hello, I am the manager. We apologize for the delay and are looking into this.", senderName: "Yasir (Manager)" },
      user: { name: "Yasir (Manager)" },
      app: { get: () => null },
    },
    { status: (code) => ({ json: (d) => { sentMsgData = d; return d; } }) }
  );

  assert(sentMsgData?.success === true, "sendConversationMessage persists human staff message");
  assert(sentMsgData?.data?.isHuman === true, "Message record flagged as isHuman: true");
  assert(sentMsgData?.data?.senderName === "Yasir (Manager)", "Message senderName attributed to staff member");

  // ------------------------------------------------------------
  // 8. Human Staff Conversation Resolution
  // ------------------------------------------------------------
  console.log("\n8. TESTING HUMAN RESOLUTION & METADATA");
  let resolveStatusData = null;
  await updateConversationStatus(
    {
      businessId,
      params: { id: conversation.id },
      body: { status: "RESOLVED", resolvedByName: "Yasir (Manager)" },
      user: { name: "Yasir (Manager)" },
      app: { get: () => null },
    },
    { status: (code) => ({ json: (d) => { resolveStatusData = d; return d; } }) }
  );

  assert(resolveStatusData?.success === true, "updateConversationStatus transitions ESCALATED -> RESOLVED");
  const resolvedConv = await prisma.conversation.findUnique({
    where: { id: conversation.id },
  });
  assert(resolvedConv?.status === "RESOLVED", "Conversation status in DB is RESOLVED");
  assert(resolvedConv?.resolvedByName === "Yasir (Manager)", "Resolved by staff name recorded in DB");
  assert(Boolean(resolvedConv?.resolvedAt), "Resolved timestamp recorded in DB");

  // ------------------------------------------------------------
  // 9. Conversation Details API Shape
  // ------------------------------------------------------------
  console.log("\n9. TESTING CONVERSATION DETAIL ENDPOINT");
  let detailResData = null;
  await getConversationById(
    {
      businessId,
      params: { id: conversation.id },
      protocol: "http",
      get: () => "localhost:5000",
    },
    { status: (code) => ({ json: (d) => { detailResData = d; } }) }
  );

  assert(detailResData?.success === true, "getConversationById returns conversation");
  assert(detailResData?.data?.resolvedByName === "Yasir (Manager)", "getConversationById exposes resolvedByName");
  assert(Boolean(detailResData?.data?.resolvedAt), "getConversationById exposes resolvedAt");
  const staffMsg = detailResData?.data?.messages?.find((m) => m.isHuman);
  assert(staffMsg?.isHuman === true && staffMsg?.agentName?.includes("Staff"), "Human staff message properly distinguished in messages array");

  // ------------------------------------------------------------
  // 10. Conversation Stats (No Active Card)
  // ------------------------------------------------------------
  console.log("\n10. TESTING CONVERSATION STATS (TOTAL, RESOLVED, ESCALATED)");
  let statsData = null;
  await getConversationStats(
    { businessId, query: { dateRange: "all" } },
    { status: (code) => ({ json: (d) => { statsData = d; } }) }
  );
  assert(statsData?.success === true, "getConversationStats succeeds");
  assert(typeof statsData?.data?.total === "number", "Total conversations is a real number");
  assert(typeof statsData?.data?.resolved === "number", "Resolved count is a real number");
  assert(typeof statsData?.data?.escalated === "number", "Escalated count is a real number");

  // ------------------------------------------------------------
  // 11. Business Analytics (Category Performance & Overview)
  // ------------------------------------------------------------
  console.log("\n11. TESTING BUSINESS ANALYTICS & CATEGORY PERFORMANCE");
  let bAnalyticsData = null;
  await getBusinessAnalytics(
    { businessId, query: { timeRange: "weekly" } },
    { status: (code) => ({ json: (d) => { bAnalyticsData = d; } }) }
  );
  assert(bAnalyticsData?.success === true, "getBusinessAnalytics succeeds");
  assert(bAnalyticsData?.data?.categoryPerformance?.length > 0, "Category performance is populated from real orders", `categories: ${bAnalyticsData?.data?.categoryPerformance?.map(c => `${c.name}: ${c.value}`).join(", ")}`);
  assert(bAnalyticsData?.data?.overview?.revenue >= 0, "Revenue overview calculated from completed orders");

  // ------------------------------------------------------------
  // 12. AI Analytics
  // ------------------------------------------------------------
  console.log("\n12. TESTING AI ANALYTICS (REAL RUNS & INTENTS)");
  let aiAnalyticsData = null;
  await getAiAnalytics(
    { businessId, query: { timeRange: "weekly" } },
    { status: (code) => ({ json: (d) => { aiAnalyticsData = d; } }) }
  );
  assert(aiAnalyticsData?.success === true, "getAiAnalytics succeeds");
  assert(typeof aiAnalyticsData?.data?.aiOverview?.totalConversations === "number", "AI overview contains real total conversations");
  assert(typeof aiAnalyticsData?.data?.aiOverview?.resolutionRate === "number", "Resolution rate is calculated safely");
  assert(Array.isArray(aiAnalyticsData?.data?.agentUsage), "Agent usage returns list of all multi-agents");
  assert(Array.isArray(aiAnalyticsData?.data?.agentPerformance), "Agent performance returns multi-agent performance metrics");

  // ------------------------------------------------------------
  // CLEANUP TEST CONVERSATION & ORDERS
  // ------------------------------------------------------------
  await prisma.message.deleteMany({ where: { conversationId: conversation.id } });
  await prisma.conversation.delete({ where: { id: conversation.id } });

  console.log("\n============================================================");
  console.log(`REGRESSION SUITE FINISHED: ${testsPassed}/${testsTotal} TESTS PASSED (${Math.round((testsPassed / testsTotal) * 100)}%)`);
  console.log("============================================================\n");

  if (testsPassed === testsTotal) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runRegressionTests().catch((err) => {
  console.error("FATAL ERROR IN REGRESSION SUITE:", err);
  process.exit(1);
});
