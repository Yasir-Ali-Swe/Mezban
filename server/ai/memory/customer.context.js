import prisma from "../../config/prisma.js";

/**
 * List of non-human generic placeholders that must never be treated as valid customer names.
 */
const PLACEHOLDER_NAMES = new Set([
  "telegram user",
  "unknown customer",
  "unknown",
  "user",
  "customer",
  "null",
  "undefined",
  "{customer_name}",
  "n/a",
  "none",
  "guest",
]);

/**
 * Sanitizes a name string, returning an empty string if it is empty or matches a placeholder.
 *
 * @param {string | null | undefined} name
 * @returns {string}
 */
export function sanitizeCustomerName(name) {
  if (!name || typeof name !== "string") return "";
  const trimmed = name.trim();
  if (!trimmed || PLACEHOLDER_NAMES.has(trimmed.toLowerCase())) return "";
  return trimmed;
}

/**
 * Derives the best natural conversational display name from available customer fields.
 *
 * Priority:
 * 1. Sanitized firstName (e.g. "Yasir")
 * 2. First token of sanitized full name (e.g. "Yasir" from "Yasir Ali")
 * 3. Sanitized full name (e.g. "Yasir Ali")
 * 4. Empty string if no valid name exists
 *
 * @param {{ name?: string | null, firstName?: string | null, lastName?: string | null }} customer
 * @returns {string}
 */
export function deriveCustomerDisplayName(customer) {
  if (!customer) return "";

  const cleanFirstName = sanitizeCustomerName(customer.firstName);
  if (cleanFirstName) {
    return cleanFirstName;
  }

  const cleanFullName = sanitizeCustomerName(customer.name);
  if (cleanFullName) {
    return cleanFullName;
  }

  const cleanLastName = sanitizeCustomerName(customer.lastName);
  if (cleanLastName) {
    return cleanLastName;
  }

  return "";
}

/**
 * Retrieves and builds a structured, sanitized Customer Context object for the AI pipeline.
 *
 * @param {{ customerId: string, businessId: string, currentConversationId?: string | null }} params
 * @returns {Promise<{
 *   customerId: string,
 *   customerName: string,
 *   firstName: string,
 *   lastName: string,
 *   phone: string | null,
 *   email: string | null,
 *   telegramChatId: string | null,
 *   isReturningCustomer: boolean,
 *   pastConversationsCount: number,
 *   recentOrders: Array<object>,
 *   recentReservations: Array<object>,
 * }>}
 */
export async function getCustomerContext({ customerId, businessId, currentConversationId = null }) {
  if (!customerId || !businessId) {
    return {
      customerId: customerId || "",
      customerName: "",
      firstName: "",
      lastName: "",
      phone: null,
      email: null,
      telegramChatId: null,
      isReturningCustomer: false,
      pastConversationsCount: 0,
      recentOrders: [],
      recentReservations: [],
    };
  }

  try {
    const [customer, recentOrders, recentReservations, pastConversationsCount] = await Promise.all([
      prisma.customer.findFirst({
        where: { id: customerId, businessId },
      }),
      prisma.order.findMany({
        where: { customerId, businessId },
        orderBy: { createdAt: "desc" },
        take: 3,
        include: { items: true },
      }),
      prisma.reservation.findMany({
        where: { customerId, businessId },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),
      prisma.conversation.count({
        where: {
          customerId,
          businessId,
          ...(currentConversationId ? { id: { not: currentConversationId } } : {}),
        },
      }),
    ]);
    if (!customer) {
      return {
        customerId,
        customerName: "",
        firstName: "",
        lastName: "",
        phone: null,
        email: null,
        telegramChatId: null,
        isReturningCustomer: false,
        pastConversationsCount: 0,
        recentOrders: [],
        recentReservations: [],
      };
    }

    const customerName = deriveCustomerDisplayName(customer);
    const cleanFirstName = sanitizeCustomerName(customer.firstName);
    const cleanLastName = sanitizeCustomerName(customer.lastName);

    const isReturningCustomer =
      recentOrders.length > 0 || recentReservations.length > 0 || pastConversationsCount > 0;

    return {
      customerId: customer.id,
      customerName,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      phone: customer.phone || null,
      email: customer.email || null,
      telegramChatId: customer.telegramChatId || null,
      isReturningCustomer,
      pastConversationsCount,
      recentOrders: recentOrders.map((o) => {
        const parts = [o.shippingStreet, o.shippingCity, o.shippingState, o.shippingZipCode, o.shippingCountry].filter(
          Boolean
        );
        return {
          orderNumber: o.orderNumber,
          total: Number(o.total),
          status: o.status,
          orderType: o.orderType,
          paymentMethod: o.paymentMethod || null,
          shippingAddress: parts.length > 0 ? parts.join(", ") : null,
          customerPhone: o.customerPhone || null,
          createdAt: o.createdAt,
          items: o.items.map((i) => `${i.quantity}x ${i.name}`),
        };
      }),
      recentReservations: recentReservations.map((r) => ({
        reservationNumber: r.reservationNumber,
        reservationAt: r.reservationAt,
        guestCount: r.guestCount,
        status: r.status,
      })),
    };
  } catch (err) {
    console.error("[Customer Context Helper] Failed to load customer context:", err.message);
    return {
      customerId,
      customerName: "",
      firstName: "",
      lastName: "",
      phone: null,
      email: null,
      telegramChatId: null,
      isReturningCustomer: false,
      pastConversationsCount: 0,
      recentOrders: [],
      recentReservations: [],
    };
  }
}
