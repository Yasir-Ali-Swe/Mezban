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
  if (toolNames.includes("checkAvailability")) {
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

  // 2. Semantic query matching for RAG and general intents
  if (
    clean.includes("food") ||
    clean.includes("variat") ||
    clean.includes("variety") ||
    clean.includes("cuisine") ||
    clean.includes("specialt") ||
    clean.includes("recommend") ||
    clean.includes("dish") ||
    clean.includes("dishes") ||
    clean.includes("serve") ||
    clean.includes("what to eat")
  ) {
    return { intent: "FOOD_INFORMATION", capability: ragUsed ? "RAG" : capability, agent: "GENERAL_AGENT" };
  }

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
    return { intent: "PAYMENT_INFORMATION", capability: ragUsed ? "RAG" : capability, agent: "GENERAL_AGENT" };
  }

  if (
    clean.includes("deliver") ||
    clean.includes("delivery") ||
    clean.includes("shipping") ||
    clean.includes("minimum order") ||
    clean.includes("delivery fee") ||
    clean.includes("rider")
  ) {
    return { intent: "DELIVERY_INFORMATION", capability: ragUsed ? "RAG" : capability, agent: "GENERAL_AGENT" };
  }

  if (
    clean.includes("reservation policy") ||
    clean.includes("book in advance") ||
    clean.includes("reservation rules") ||
    clean.includes("booking policy") ||
    clean.includes("policy for reservation")
  ) {
    return { intent: "RESERVATION_INFORMATION", capability: ragUsed ? "RAG" : capability, agent: "GENERAL_AGENT" };
  }

  if (
    clean.includes("hour") ||
    clean.includes("open") ||
    clean.includes("close") ||
    clean.includes("timing") ||
    clean.includes("schedule")
  ) {
    return { intent: "BUSINESS_HOURS", capability: "TOOL", agent: "GENERAL_AGENT" };
  }

  if (
    clean.includes("menu") ||
    clean.includes("burger") ||
    clean.includes("pizza") ||
    clean.includes("karahi") ||
    clean.includes("biryani") ||
    clean.includes("price") ||
    clean.includes("cost") ||
    clean.includes("rate") ||
    clean.includes("available")
  ) {
    return { intent: "MENU_SEARCH", capability: "TOOL", agent: "ORDER_AGENT" };
  }

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
    return { intent: "BUSINESS_INFORMATION", capability: ragUsed ? "RAG" : capability, agent: "GENERAL_AGENT" };
  }

  if (
    clean.includes("hello") ||
    clean.includes("hi") ||
    clean.includes("hey") ||
    clean.includes("thanks") ||
    clean.includes("thank you") ||
    clean.includes("bye") ||
    clean.includes("start")
  ) {
    return { intent: "GREETING", capability: "NEITHER", agent: "GENERAL_AGENT" };
  }

  if (clean.includes("complaint") || clean.includes("bad") || clean.includes("cold") || clean.includes("manager")) {
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
  console.error(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.error(`║  ❌ MEZBAN ERROR — ${type.padEnd(40)}║`);
  console.error(`╚══════════════════════════════════════════════════════════════╝`);
  console.error(`  ${message}`);
  console.error(`════════════════════════════════════════════════════════════════\n`);
}

// ─── Print + Clear ──────────────────────────────────────────────────────────

export function printAndClear(traceId) {
  const t = traces.get(traceId);
  if (!t) return;

  const elapsed = Date.now() - t.startTime;
  const sep = "════════════════════════════════════════════════════════════════";

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

  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║              📡  MEZBAN REQUEST TRACE                        ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝`);

  // 1. User Query
  console.log(`\n📩  USER QUERY`);
  console.log(`    ${t.query || "(empty)"}`);

  // 2. Routing
  console.log(`\n🧠  ROUTING`);
  console.log(`    Agent     : ${finalAgent}`);
  console.log(`    Intent    : ${finalIntent}`);
  console.log(`    Capability: ${finalCapability}`);
  console.log(`    Fast-path : ${t.fastPath ? "YES (immediate response)" : "NO"}`);

  // 3. RAG
  if (t.rag.used) {
    console.log(`\n📚  RAG`);
    console.log(`    YES`);
    console.log(`    Search Query : "${t.rag.query}"`);
    console.log(`    Chunks Count : ${t.rag.chunkCount}`);
    if (t.rag.chunks.length > 0) {
      t.rag.chunks.forEach((chunk, i) => {
        const title = chunk.documentTitle || chunk.docTitle || chunk.type || "Document";
        const sim = typeof chunk.similarity === "number" ? chunk.similarity.toFixed(4) : "n/a";
        const content = (chunk.content || chunk.text || "").trim().substring(0, 300);
        console.log(`\n    ┌─ Chunk ${i + 1}: [${title}] (similarity: ${sim})`);
        content.split("\n").forEach((line) => console.log(`    │  ${line}`));
        console.log(`    └${"─".repeat(50)}`);
      });
    }
  } else {
    console.log(`\n📚  RAG\n    NO`);
  }

  // 4. Tool Calls
  if (t.tools.length > 0) {
    console.log(`\n🔧  TOOL CALLS`);
    console.log(`    ${t.tools.length} call(s)`);
    t.tools.forEach((tool, i) => {
      console.log(`\n    Tool ${i + 1}: ${tool.name}${tool.timeMs ? ` (${tool.timeMs}ms)` : ""}`);
      const argsStr = JSON.stringify(tool.args, null, 2);
      if (argsStr && argsStr !== "{}") {
        console.log(`    Arguments:`);
        argsStr.split("\n").forEach((line) => console.log(`      ${line}`));
      }
      if (tool.name !== "transfer_to_agent" && tool.result !== undefined) {
        console.log(`    Result:`);
        const resultStr = JSON.stringify(tool.result, null, 2);
        const preview = resultStr.length > 600 ? resultStr.substring(0, 600) + "\n      ... (truncated)" : resultStr;
        preview.split("\n").forEach((line) => console.log(`      ${line}`));
      }
    });
  } else {
    console.log(`\n🔧  TOOL CALLS\n    none`);
  }

  // 5. LLM Context Summary
  if (t.llmContext && !t.fastPath) {
    console.log(`\n📋  DATA SENT TO LLM (Context Summary)`);
    const lines = t.llmContext.split("\n");
    lines.slice(0, 20).forEach((line) => console.log(`    ${line}`));
    if (lines.length > 20) {
      console.log(`    ... (${lines.length - 20} more lines)`);
    }
  }

  // 6. Raw LLM Response
  if (!t.fastPath) {
    console.log(`\n🤖  DATA RECEIVED FROM LLM (Raw Response)`);
    const raw = t.rawLlmResponse || "(empty — fallback used)";
    const rawPreview = raw.length > 600 ? raw.substring(0, 600) + "\n    ... (truncated)" : raw;
    rawPreview.split("\n").forEach((line) => console.log(`    ${line}`));
  }

  // 7. Telegram Output
  console.log(`\n📤  DATA SENT TO TELEGRAM`);
  const tg = t.telegramOutput || "(empty)";
  const tgPreview = tg.length > 600 ? tg.substring(0, 600) + "\n    ... (truncated)" : tg;
  tgPreview.split("\n").forEach((line) => console.log(`    ${line}`));

  // 8. Errors
  if (t.errors.length > 0) {
    console.log(`\n❌  ERRORS DETECTED (${t.errors.length})`);
    t.errors.forEach((err, i) => {
      console.log(`\n    ┌─ Error ${i + 1}: [${err.type}]`);
      err.message.split("\n").forEach((line) => console.log(`    │  ${line}`));
      console.log(`    └${"─".repeat(50)}`);
    });
  }

  // 9. Total Latency
  console.log(`\n⏱   TOTAL LATENCY: ${elapsed} ms`);
  console.log(`\n${sep}\n`);

  traces.delete(traceId);
  return { intent: finalIntent, capability: finalCapability, agent: finalAgent };
}
