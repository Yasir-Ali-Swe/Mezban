/**
 * Extracts session state safely from Google ADK's Context object.
 *
 * In Google ADK JS:
 * - toolContext is an instance of Context (extends ReadonlyContext)
 * - toolContext.state is an instance of State class (.get(key), .set(key, value), .toRecord())
 * - toolContext.invocationContext.session.state is the underlying raw session state object
 *
 * This helper normalizes access across all ADK contexts and versions.
 */
export function getToolSessionState(tool_context) {
  if (!tool_context) return {};

  // 1. Direct invocationContext session state object
  if (tool_context.invocationContext?.session?.state) {
    const rawState = tool_context.invocationContext.session.state;
    return {
      businessId: rawState.businessId,
      customerId: rawState.customerId,
      conversationId: rawState.conversationId,
      restaurantName: rawState.restaurantName,
      customerName: rawState.customerName,
      customerContextText: rawState.customerContextText,
      traceId: rawState.traceId,
      telegramChatId: rawState.telegramChatId,
      ...rawState,
    };
  }

  // 2. ADK State instance methods (.get / .toRecord)
  if (tool_context.state && typeof tool_context.state.get === "function") {
    const record = typeof tool_context.state.toRecord === "function" ? tool_context.state.toRecord() : {};
    return {
      businessId: tool_context.state.get("businessId"),
      customerId: tool_context.state.get("customerId"),
      conversationId: tool_context.state.get("conversationId"),
      restaurantName: tool_context.state.get("restaurantName"),
      customerName: tool_context.state.get("customerName"),
      customerContextText: tool_context.state.get("customerContextText"),
      traceId: tool_context.state.get("traceId"),
      telegramChatId: tool_context.state.get("telegramChatId"),
      ...record,
    };
  }

  // 3. Fallback for plain session object
  if (tool_context.session?.state) {
    return tool_context.session.state;
  }

  return {};
}
