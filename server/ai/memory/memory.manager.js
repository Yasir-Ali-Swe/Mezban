import { getShortTermMemory } from "./shortTerm.memory.js";
import { getLongTermMemory } from "./longTerm.memory.js";

/**
 * Combines short-term conversation context and long-term customer context
 */
export async function getConversationMemory({ conversationId, customerId, businessId }) {
  const [messages, customerProfile] = await Promise.all([
    getShortTermMemory(conversationId, 10),
    getLongTermMemory(customerId, businessId, conversationId),
  ]);

  const conversationHistoryText = messages
    .map((m) => `${m.sender === "CUSTOMER" ? "Customer" : "Assistant"}: ${m.content}`)
    .join("\n");

  // Determine conversation & greeting state accurately
  const priorAssistantMessages = messages.filter(
    (m) => (m.sender === "AGENT" || m.sender === "assistant") && m.content && m.content.trim().length > 0
  );
  const isOngoingConversation = priorAssistantMessages.length > 0;
  const isReturningCustomer = Boolean(customerProfile?.isReturningCustomer);

  let greetingScenario = "CASE_A_NEW_CUSTOMER";
  let greetingScenarioDescription = "Brand-New Customer (First Conversation Ever)";

  if (isOngoingConversation) {
    greetingScenario = "CASE_B_EXISTING_CONVERSATION";
    greetingScenarioDescription = "Existing Conversation (Ongoing Chat with Prior Messages)";
  } else if (isReturningCustomer) {
    greetingScenario = "CASE_C_RETURNING_CUSTOMER_NEW_CONVERSATION";
    greetingScenarioDescription = "Returning Customer Starting a New Conversation";
  }

  let customerContextText = "";
  if (customerProfile) {
    customerContextText = `Customer Name: ${customerProfile.customerName || "N/A"}`;
    customerContextText += `\nCustomer Status: ${isReturningCustomer ? "Returning Customer (has past interaction/history)" : "New Customer (first time interacting)"}`;
    customerContextText += `\nConversation Status: ${isOngoingConversation ? "Ongoing Conversation" : "New Conversation"}`;
    customerContextText += `\nGREETING MODE: ${greetingScenario} (${greetingScenarioDescription})`;

    if (customerProfile.phone) {
      customerContextText += `\nCustomer Phone: ${customerProfile.phone}`;
    }
    if (customerProfile.recentOrders?.length > 0) {
      const latestDelivery = customerProfile.recentOrders.find(
        (o) => o.orderType === "DELIVERY" && o.shippingAddress
      );
      if (latestDelivery?.shippingAddress) {
        customerContextText += `\nPrevious Delivery Address on file: ${latestDelivery.shippingAddress}`;
      }
      if (customerProfile.recentOrders[0]?.paymentMethod) {
        customerContextText += `\nPrevious Payment Method on file: ${customerProfile.recentOrders[0].paymentMethod}`;
      }
      const ordersStr = customerProfile.recentOrders
        .map(
          (o) =>
            `#${o.orderNumber} (${o.status}, Rs. ${o.total}, Type: ${o.orderType}${o.shippingAddress ? `, Address: ${o.shippingAddress}` : ""
            }): ${o.items.join(", ")}`
        )
        .join("; ");
      customerContextText += `\nRecent Orders: ${ordersStr}`;
    }
    if (customerProfile.recentReservations?.length > 0) {
      const resStr = customerProfile.recentReservations
        .map(
          (r) =>
            `#${r.reservationNumber} for ${r.guestCount} guests on ${r.reservationAt.toLocaleDateString()} (${r.status})`
        )
        .join("; ");
      customerContextText += `\nRecent Reservations: ${resStr}`;
    }
  }

  return {
    messages,
    customerProfile,
    isOngoingConversation,
    isReturningCustomer,
    greetingScenario,
    conversationHistoryText,
    customerContextText,
  };
}
