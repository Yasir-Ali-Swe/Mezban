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
  if (toolNames.includes("getMenuItem")) {
    return { intent: "MENU_ITEM_INFORMATION", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("checkMenuAvailability")) {
    return { intent: "MENU_AVAILABILITY", capability, agent: "ORDER_AGENT" };
  }
  if (toolNames.includes("searchMenu")) {
    return { intent: "MENU_SEARCH", capability, agent: "ORDER_AGENT" };
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

  // Cancel Order (DB TOOL)
  if (/\b(cancel\s+(my\s+)?order|cancel\s+ord-\d+|cancel\s+it)\b/i.test(clean)) {
    return { intent: "CANCEL_ORDER", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Order Status & Tracking (DB TOOL)
  if (/\b(where('?s|\s+is)\s+(my\s+)?order|track\s+(my\s+)?order|order\s+status)\b/i.test(clean)) {
    return { intent: "GET_ORDER", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Customer Order History (DB TOOL)
  if (/\b(previous\s+orders?|my\s+orders?|past\s+orders?|order\s+history)\b/i.test(clean)) {
    return { intent: "CUSTOMER_ORDERS", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Place / Create Order (DB TOOL)
  if (/\b(i\s+want\s+to\s+order|place\s+(an?\s+)?order|order\s+\d+|reorder)\b/i.test(clean)) {
    return { intent: "CREATE_ORDER", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Specific Item Pricing (DB TOOL)
  if (/\b(price\s+of|cost\s+of|how\s+much\s+is|rate\s+of)\b/i.test(clean)) {
    return { intent: "MENU_ITEM_INFORMATION", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Item Availability (DB TOOL)
  if (/\b(is\s+.*?\s+available|do\s+you\s+have\s+.*?\s+in\s+stock|available\s+today|in\s+stock)\b/i.test(clean)) {
    return { intent: "MENU_AVAILABILITY", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Menu Search & Browsing (DB TOOL)
  if (
    /\b(menu|menu\s+items?|dishes|what\s+dishes|burgers?|pizzas?|pastas?|karahi|biryani|fries|available\s+items?|food\s+items?|what\s+can\s+i\s+order|what\s+to\s+order|list\s+(the\s+)?menu)\b/i.test(
      clean
    )
  ) {
    return { intent: "MENU_SEARCH", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Deals & Combos (DB TOOL)
  if (/\b(deals?|combos?|promotions?|discounts?|family\s+deal|deal\s+\d+|special\s+offers?|active\s+offers?|current\s+offers?|latest\s+offers?)\b/i.test(clean)) {
    return { intent: "DEAL_SEARCH", capability: "TOOL", agent: "ORDER_AGENT" };
  }

  // Food Variety & Cuisines (RAG)
  if (
    /\b(food\s+variety|cuisines?|specialt(y|ies)|what\s+kind\s+of\s+food|what\s+type\s+of\s+food|what\s+food\s+do\s+you\s+(serve|specialize|recommend)|food\s+recommendations?|recommend|known\s+for)\b/i.test(
      clean
    )
  ) {
    return { intent: "FOOD_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
  }

  // Payment Information (RAG)
  if (
    /\b(payment\s+(methods?|options?|policy|details)|how\s+can\s+i\s+pay|accepted\s+payment|pay\s+by\s+(cash|card|online)|easypaisa|jazzcash|bank\s+transfer|cash\s+on\s+delivery)\b/i.test(
      clean
    )
  ) {
    return { intent: "PAYMENT_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
  }

  // Delivery Information (RAG)
  if (
    /\b(delivery\s+(policy|charges?|fees?|areas?|timings?|rules?)|do\s+you\s+deliver|where\s+do\s+you\s+deliver|minimum\s+delivery|minimum\s+order|delivery\s+fee|delivery\s+to\s+)\b/i.test(
      clean
    )
  ) {
    return { intent: "DELIVERY_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
  }

  // Reservation Policy (RAG)
  if (
    /\b(reservation\s+policy|booking\s+policy|book\s+in\s+advance|reservation\s+rules|how\s+does\s+reservation\s+work)\b/i.test(
      clean
    )
  ) {
    return { intent: "RESERVATION_INFORMATION", capability: "RAG", agent: "GENERAL_AGENT" };
  }

  // Live Table Booking (DB TOOL)
  if (/\b(book\s+(a\s+)?table|reserve\s+(a\s+)?table|table\s+for\s+\d+|table\s+booking|reservation\s+for)\b/i.test(clean)) {
    return { intent: "CHECK_RESERVATION_AVAILABILITY", capability: "TOOL", agent: "RESERVATION_AGENT" };
  }

  // Operating Hours (DB TOOL)
  if (
    /\b(opening\s+hours?|closing\s+hours?|what\s+time\s+do\s+you\s+(open|close)|are\s+you\s+open|are\s+you\s+closed|timings?|schedule|today'?s\s+hours?|open\s+on\s+(sunday|monday|tuesday|wednesday|thursday|friday|saturday))\b/i.test(
      clean
    )
  ) {
    return { intent: "BUSINESS_HOURS", capability: "TOOL", agent: "GENERAL_AGENT" };
  }

  // Business Information (RAG / DB TOOL)
  if (
    /\b(where\s+are\s+you\s+located|what\s+is\s+your\s+(address|location|phone|number|email|website)|contact\s+(number|info)|about\s+the\s+restaurant|restaurant\s+story|who\s+are\s+you)\b/i.test(
      clean
    )
  ) {
    return { intent: "BUSINESS_INFORMATION", capability: ragUsed ? "RAG" : "TOOL", agent: "GENERAL_AGENT" };
  }

  // Support & Complaints
  if (
    /\b(complaint|cold\s+food|food\s+(was|is)\s+cold|bad\s+food|wrong\s+order|wrong\s+item|talk\s+to\s+(a\s+)?manager|human\s+agent|customer\s+support|refund|problem\s+with\s+(my\s+)?order)\b/i.test(
      clean
    )
  ) {
    return { intent: "SUPPORT", capability: "NEITHER", agent: "SUPPORT_AGENT" };
  }

  // Pure Greetings ONLY (e.g. "hi", "hello", "hey", "good morning", "thanks", "bye", "/start", "how are you?", "السلام علیکم")
  const isPureGreeting =
    /^(hi|hello|hey|good\s*(morning|afternoon|evening|night)|aoa|salam|assalam(\s*u\s*alaikum)?|slm|greetings|thanks|thank\s*you|bye|goodbye|cya|see\s*you|ok|okay|k|how\s*are\s*you\??|how\s*r\s*u\??|\/start|السلام\s*علیکم)[!.,?\s]*$/i.test(
      clean
    );

  if (isPureGreeting) {
    return { intent: "GREETING", capability: "NEITHER", agent: "GENERAL_AGENT" };
  }

  // Off-Topic / Non-Restaurant query fallback
  return {
    intent: "OFF_TOPIC",
    capability: "NEITHER",
    agent: "GENERAL_AGENT",
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
