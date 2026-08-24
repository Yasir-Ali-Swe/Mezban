import { getShortTermMemory } from "./shortTerm.memory.js";
import { getLongTermMemory } from "./longTerm.memory.js";

/**
 * Combines short-term conversation context and long-term customer context
 */
export async function getConversationMemory({ conversationId, customerId, businessId }) {
  const [messages, customerProfile] = await Promise.all([
    getShortTermMemory(conversationId, 10),
    getLongTermMemory(customerId, businessId),
  ]);

  const conversationHistoryText = messages
    .map((m) => `${m.sender === "CUSTOMER" ? "Customer" : "Assistant"}: ${m.content}`)
    .join("\n");

  let customerContextText = "";
  if (customerProfile) {
    customerContextText = `Customer Name: ${customerProfile.customerName || "Valued Customer"}`;
    if (customerProfile.recentOrders?.length > 0) {
      const ordersStr = customerProfile.recentOrders
        .map((o) => `#${o.orderNumber} (${o.status}, Rs. ${o.total}): ${o.items.join(", ")}`)
        .join("; ");
      customerContextText += `\nRecent Orders: ${ordersStr}`;
    }
    if (customerProfile.recentReservations?.length > 0) {
      const resStr = customerProfile.recentReservations
        .map((r) => `#${r.reservationNumber} for ${r.guestCount} guests on ${r.reservationAt.toLocaleDateString()} (${r.status})`)
        .join("; ");
      customerContextText += `\nRecent Reservations: ${resStr}`;
    }
  }

  return {
    messages,
    customerProfile,
    conversationHistoryText,
    customerContextText,
  };
}
