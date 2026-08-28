/**
 * Mezban Request Tracer & Intent Classifier
 *
 * Provides accurate intent classification, RAG verification, tool tracking,
 * and diagnostic telemetry for every Telegram message.
 */

const traces = new Map();

// ─── Intent & Capability Classification ──────────────────────────────────────

export function determineIntentAndCapability({ query, agentName, tools = [], ragUsed = false, fastPath = false }) {
  if (fastPath) {
    return {
      intent: "GREETING",
      capability: "NEITHER",
      agent: "GENERAL_AGENT",
    };
  }

  const clean = (query || "").toLowerCase().trim();

  // 1. Check tools called first (authoritative signals)
  const toolNames = tools.map((t) => t.name);
  const dbTools = tools.filter((t) => t.name !== "searchKnowledgeBase" && t.name !== "transfer_to_agent");

  // Determine Capability
  let capability = "NEITHER";
  if (ragUsed && dbTools.length > 0) {
    capability = "BOTH";
  } else if (ragUsed) {
    capability = "RAG";
  } else if (dbTools.length > 0) {
    capability = "TOOL";
  }

  // Determine Intent from Tool Invocations
  if (toolNames.includes("getBusinessHours")) {
    return { intent: "BUSINESS_HOURS", capability, agent: "GENERAL_AGENT" };
  }
  if (toolNames.includes("searchMenu")) {
    return { intent: "MENU_SEARCH", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("getMenuItem")) {
    return { intent: "MENU_ITEM_INFORMATION", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("checkMenuAvailability")) {
    return { intent: "MENU_AVAILABILITY", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("searchDeals") || toolNames.includes("getDeal")) {
    return { intent: "DEAL_SEARCH", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("createOrder")) {
    return { intent: "CREATE_ORDER", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("getOrder")) {
    return { intent: "GET_ORDER", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("cancelOrder")) {
    return { intent: "CANCEL_ORDER", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("getCustomerOrders")) {
    return { intent: "CUSTOMER_ORDERS", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("checkAvailability") || toolNames.includes("checkReservationAvailability")) {
    return { intent: "CHECK_RESERVATION_AVAILABILITY", capability, agent: "RESERVATION_AGENT" };
  }
  if (toolNames.includes("createReservation")) {
    return { intent: "CREATE_RESERVATION", capability, agent: "RESERVATION_AGENT" };
  }
  if (toolNames.includes("getReservation") || toolNames.includes("cancelReservation")) {
    return { intent: "GET_RESERVATION", capability, agent: "RESERVATION_AGENT" };
  }
  if (toolNames.includes("getBusinessInfo")) {
    return { intent: "BUSINESS_INFORMATION", capability, agent: "GENERAL_AGENT" };
  }
  if (toolNames.includes("escalateConversation")) {
    return { intent: "SUPPORT", capability, agent: "SUPPORT_AGENT" };
  }
  if (toolNames.includes("searchKnowledgeBase") || ragUsed) {
    if (clean.includes("food") || clean.includes("variat") || clean.includes("variety") || clean.includes("cuisine") || clean.includes("specialt")) {
      return { intent: "FOOD_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
    }
    if (clean.includes("deliver") || clean.includes("shipping") || clean.includes("area") || clean.includes("fee")) {
      return { intent: "DELIVERY_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
    }
    if (clean.includes("payment") || clean.includes("pay") || clean.includes("card") || clean.includes("cash") || clean.includes("account")) {
      return { intent: "PAYMENT_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
    }
    if (clean.includes("reservation") || clean.includes("book") || clean.includes("policy")) {
      return { intent: "RESERVATION_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
    }
    if (clean.includes("about the restaurant") || clean.includes("story") || clean.includes("who are you") || clean.includes("history") || clean.includes("about you")) {
      return { intent: "BUSINESS_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
    }
    return { intent: "FOOD_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
  }

  // 2. Semantic query matching for RAG, DB tools, and general intents

  // Menu Search & Browsing (DB TOOL)
  if (
    clean.includes("menu") ||
    clean.includes("menu items") ||
    clean.includes("what dishes") ||
    clean.includes("what burgers") ||
    clean.includes("what pizzas") ||
    clean.includes("what items") ||
    clean.includes("available items") ||
    clean.includes("food items") ||
    clean.includes("dish list") ||
    clean.includes("burger") ||
    clean.includes("pizza") ||
    clean.includes("pasta") ||
    clean.includes("fries") ||
    clean.includes("karahi") ||
    clean.includes("biryani") ||
    clean.includes("price") ||
    clean.includes("cost") ||
    clean.includes("rate") ||
    clean.includes("available") ||
    clean.includes("what can i order") ||
    clean.includes("what to order") ||
    clean.includes("order items")
  ) {
    return { intent: "MENU_SEARCH", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Deals & Combos (DB TOOL)
  if (
    clean.includes("deal") ||
    clean.includes("deals") ||
    clean.includes("combo") ||
    clean.includes("offer") ||
    clean.includes("discount")
  ) {
    return { intent: "DEAL_SEARCH", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Food Variety & Cuisines (RAG)
  if (
    clean.includes("food variety") ||
    clean.includes("variat") ||
    clean.includes("variety") ||
    clean.includes("cuisine") ||
    clean.includes("cuisines") ||
    clean.includes("specialt") ||
    clean.includes("specialties") ||
    clean.includes("what kind of food do you serve") ||
    clean.includes("what are you known for") ||
    clean.includes("food type") ||
    clean.includes("types of food")
  ) {
    return { intent: "FOOD_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
  }

  // Payment Information (RAG)
  if (
    clean.includes("payment") ||
    clean.includes("pay") ||
    clean.includes("easypaisa") ||
    clean.includes("jazzcash") ||
    clean.includes("card") ||
    clean.includes("cash") ||
    clean.includes("account") ||
    clean.includes("bank")
  ) {
    return { intent: "PAYMENT_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
  }

  // Delivery Information (RAG)
  if (
    clean.includes("deliver") ||
    clean.includes("delivery") ||
    clean.includes("shipping") ||
    clean.includes("minimum order") ||
    clean.includes("delivery fee") ||
    clean.includes("rider")
  ) {
    return { intent: "DELIVERY_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
  }

  // Reservation Policy (RAG)
  if (
    clean.includes("reservation policy") ||
    clean.includes("book in advance") ||
    clean.includes("reservation rules") ||
    clean.includes("booking policy") ||
    clean.includes("policy for reservation")
  ) {
    return { intent: "RESERVATION_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
  }

  // Live Table Booking (DB TOOL)
  if (
    clean.includes("book a table") ||
    clean.includes("reserve a table") ||
    clean.includes("table for") ||
    clean.includes("table booking")
  ) {
    return { intent: "CHECK_RESERVATION_AVAILABILITY", capability: "TOOL", agent: "RESERVATION_AGENT" };
  }

  // Operating Hours (DB TOOL)
  if (
    clean.includes("hour") ||
    clean.includes("open") ||
    clean.includes("close") ||
    clean.includes("timing") ||
    clean.includes("schedule") ||
    clean.includes("opening time") ||
    clean.includes("closing time")
  ) {
    return { intent: "BUSINESS_HOURS", capability: "TOOL", agent: "GENERAL_AGENT" };
  }

  // Business Information (RAG / DB TOOL)
  if (
    clean.includes("about the restaurant") ||
    clean.includes("restaurant story") ||
    clean.includes("who are you") ||
    clean.includes("address") ||
    clean.includes("located") ||
    clean.includes("location") ||
    clean.includes("contact") ||
    clean.includes("phone") ||
    clean.includes("restaurant name")
  ) {
    return { intent: "BUSINESS_INFORMATION", capability: ragUsed ? "RAG" : "TOOL", agent: "GENERAL_AGENT" };
  }

  // Greetings
  if (
    clean.includes("hello") ||
    clean.includes("hi") ||
    clean.includes("hey") ||
    clean.includes("good morning") ||
    clean.includes("good afternoon") ||
    clean.includes("good evening") ||
    clean.includes("salam") ||
    clean.includes("aoa") ||
    clean.includes("thanks") ||
    clean.includes("thank you") ||
    clean.includes("bye") ||
    clean.includes("start")
  ) {
    return { intent: "GREETING", capability: "NEITHER", agent: "GENERAL_AGENT" };
  }

  // Support & Complaints
  if (
    clean.includes("complaint") ||
    clean.includes("bad") ||
    clean.includes("cold") ||
    clean.includes("manager") ||
    clean.includes("wrong") ||
    clean.includes("issue") ||
    clean.includes("problem")
  ) {
    return { intent: "SUPPORT", capability: "NEITHER", agent: "SUPPORT_AGENT" };
  }

  return {
    intent: "GENERAL_QUERY",
    capability,
    agent: agentName || "GENERAL_AGENT",
  };
}

// ─── Lifecycle ─────────────────────────────────────────────────────────────

export function initTrace(traceId) {
  traces.set(traceId, {
    traceId,
    query: "",
    agentName: "",
    agentType: "",
    intent: "",
    capability: "",
    fastPath: false,
    rag: { used: false, query: "", chunks: [], chunkCount: 0 },
    tools: [], // [{ name, args, result, timeMs }]
    llmContext: "",
    rawLlmResponse: "",
    telegramOutput: "",
    errors: [],
    startTime: Date.now(),
  });
}

export function getTrace(traceId) {
  return traces.get(traceId);
}

// ─── Setters ────────────────────────────────────────────────────────────────

export function setQuery(traceId, query) {
  const t = traces.get(traceId);
  if (t) t.query = query;
}

export function setAgentRouting(traceId, { agentName, agentType, intent, capability, fastPath = false }) {
  const t = traces.get(traceId);
  if (t) {
    if (agentName) t.agentName = agentName;
    if (agentType) t.agentType = agentType;
    if (intent) t.intent = intent;
    if (capability) t.capability = capability;
    if (fastPath !== undefined) t.fastPath = fastPath;
  }
}

export function recordRag(traceId, { query, chunks, chunkCount }) {
  const t = traces.get(traceId);
  if (t) {
    t.rag.used = true;
    t.rag.query = query;
    t.rag.chunks = chunks || [];
    t.rag.chunkCount = chunkCount || (chunks?.length ?? 0);
  }
}

export function recordToolCall(traceId, { name, args, result, timeMs }) {
  const t = traces.get(traceId);
  if (t) {
    t.tools.push({ name, args: args || {}, result, timeMs: timeMs || 0 });
  }
}

export function setLlmContext(traceId, contextText) {
  const t = traces.get(traceId);
  if (t) t.llmContext = contextText;
}

export function setRawLlmResponse(traceId, text) {
  const t = traces.get(traceId);
  if (t) t.rawLlmResponse = text;
}

export function setTelegramOutput(traceId, text) {
  const t = traces.get(traceId);
  if (t) t.telegramOutput = text;
}

export function recordError(traceId, error) {
  const t = traces.get(traceId);
  if (!t) return;
  const classified = classifyError(error);
  t.errors.push(classified);
  _printError(classified);
}

// ─── Error Classification ───────────────────────────────────────────────────

function classifyError(error) {
  const raw = error?.message || String(error);
  const msg = raw.toLowerCase();

  let type = "RUNTIME_ERROR";

  if (
    msg.includes("api_key_invalid") ||
    msg.includes("invalid api key") ||
    msg.includes("api key not valid") ||
    msg.includes("invalid_api_key") ||
    msg.includes("api key")
  ) {
    type = "API_KEY_ERROR";
  } else if (
    msg.includes("quota") ||
    msg.includes("resource_exhausted") ||
    msg.includes("rate limit") ||
    msg.includes("ratelimitexceeded") ||
    msg.includes("429") ||
    msg.includes("too many requests")
  ) {
    type = "QUOTA_EXCEEDED";
  } else if (
    (msg.includes("token") && (msg.includes("limit") || msg.includes("max"))) ||
    msg.includes("context_window") ||
    msg.includes("maximum context")
  ) {
    type = "TOKEN_LIMIT_ERROR";
  } else if (msg.includes("timeout") || msg.includes("etimedout") || msg.includes("timed out")) {
    type = "TIMEOUT_ERROR";
  } else if (
    msg.includes("fetch") ||
    msg.includes("network") ||
    msg.includes("econnrefused") ||
    msg.includes("enotfound")
  ) {
    type = "NETWORK_ERROR";
  } else if (msg.includes("permission_denied") || msg.includes("unauthorized") || msg.includes("403")) {
    type = "AUTH_ERROR";
  }

  return { type, message: raw };
}

function _printError({ type, message }) {
  console.error(`\n╔══════════════════════════════════════╗`);
  console.error(`║  ❌ MEZBAN ERROR                     ║`);
  console.error(`╚══════════════════════════════════════╝`);
  console.error(`  [${type}] ${message}\n`);
}

// ─── Print + Clear (Simplified Terminal Output) ────────────────────────────

export function printAndClear(traceId) {
  const t = traces.get(traceId);
  if (!t) return;

  // Derive intent and capability dynamically based on query and tools executed
  const derived = determineIntentAndCapability({
    query: t.query,
    agentName: t.agentType || t.agentName,
    tools: t.tools,
    ragUsed: t.rag.used,
    fastPath: t.fastPath,
  });

  const finalIntent = derived.intent || t.intent || "GENERAL_QUERY";
  const finalCapability = derived.capability || t.capability || "NEITHER";
  let finalAgent = derived.agent;
  if (!finalAgent || finalAgent === "GENERAL_AGENT") {
    if (t.agentType && t.agentType !== "GENERAL_AGENT") {
      finalAgent = t.agentType;
    } else {
      finalAgent = derived.agent || "GENERAL_AGENT";
    }
  }

  // Actual database / application tools executed (excluding RAG and internal agent transfer)
  const executedDbTools = Array.from(
    new Set(
      (t.tools || [])
        .filter((tool) => tool.name && tool.name !== "searchKnowledgeBase" && tool.name !== "transfer_to_agent")
        .map((tool) => tool.name)
    )
  );

  const sep = "════════════════════════════════════";

  console.log(`\n${sep}`);
  console.log(`USER QUERY`);
  console.log(`${t.query || "(empty)"}`);

  console.log(`\nAGENT ROUTING`);
  console.log(`Agent : ${finalAgent}`);
  console.log(`Intent: ${finalIntent}`);

  console.log(`\nRAG`);
  if (t.rag.used) {
    console.log(`Used`);
    console.log(`Tool: searchKnowledgeBase`);
  } else {
    console.log(`Not Used`);
  }

  console.log(`\nTOOL USED`);
  if (executedDbTools.length > 0) {
    console.log(executedDbTools.join("\n"));
  } else {
    console.log(`None`);
  }

  if (t.errors.length > 0) {
    console.log(`\nERRORS DETECTED (${t.errors.length})`);
    t.errors.forEach((err, i) => {
      console.log(`[Error ${i + 1}] ${err.type}: ${err.message}`);
    });
  }

  console.log(`${sep}\n`);

  traces.delete(traceId);
  return { intent: finalIntent, capability: finalCapability, agent: finalAgent };
}
