import { FunctionTool } from "@google/adk";
import { createOrderTool } from "../../tools/orders/createOrder.tool.js";
import { getOrderTool } from "../../tools/orders/getOrder.tool.js";
import { getCustomerOrdersTool } from "../../tools/orders/getCustomerOrders.tool.js";
import { cancelOrderTool } from "../../tools/orders/cancelOrder.tool.js";
import { getToolSessionState } from "./context.helper.js";

/**
 * ADK FunctionTool wrapper: createOrder
 */
export const adkCreateOrderTool = new FunctionTool({
  name: "createOrder",
  description:
    "Creates a new customer food order for menu items or deals. Call this when the customer explicitly confirms they want to place an order.",
  parameters: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "List of dishes or deals to order with name and quantity",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Item or deal name (e.g. 'Chicken Karahi', 'Family Deal')" },
            quantity: { type: "number", description: "Quantity to order (e.g. 1, 2)" },
            menuItemId: { type: "string", description: "Optional menu item ID if known" },
            dealId: { type: "string", description: "Optional deal ID if known" },
          },
          required: ["name"],
        },
      },
      orderType: {
        type: "string",
        description: "Order fulfillment type: DELIVERY, PICKUP, or DINE_IN (default is DELIVERY)",
        enum: ["DELIVERY", "PICKUP", "DINE_IN"],
      },
      paymentMethod: {
        type: "string",
        description: "Payment method chosen by customer (e.g. 'Cash on Delivery', 'Easypaisa', 'JazzCash', 'Card')",
      },
      shippingAddress: {
        type: "string",
        description: "Complete delivery address with street and city (for DELIVERY orders)",
      },
      customerPhone: {
        type: "string",
        description: "Customer contact phone number for delivery (e.g. '0300-1234567')",
      },
      notes: {
        type: "string",
        description: "Special instructions for the kitchen or delivery rider",
      },
    },
    required: ["items"],
  },
  execute: async ({ items, orderType, paymentMethod, shippingAddress, customerPhone, phone, notes } = {}, tool_context) => {
    const { businessId, customerId, conversationId } = getToolSessionState(tool_context);
    if (!businessId || !customerId) {
      return { success: false, error: "MISSING_SESSION_CONTEXT", message: "Customer and restaurant context required to place an order." };
    }
    return createOrderTool.execute({
      businessId,
      customerId,
      conversationId,
      items,
      orderType,
      paymentMethod: paymentMethod || "Cash on Delivery",
      shippingAddress,
      customerPhone: customerPhone || phone,
      notes,
    });
  },
});

/**
 * ADK FunctionTool wrapper: getOrder
 */
export const adkGetOrderTool = new FunctionTool({
  name: "getOrder",
  description:
    "Retrieves status, total price, and item breakdown for an existing order by order number (e.g. 'ORD-123456') or ID.",
  parameters: {
    type: "object",
    properties: {
      orderNumber: {
        type: "string",
        description: "Order number (e.g. 'ORD-123456')",
      },
      orderId: {
        type: "string",
        description: "Optional order database ID if known",
      },
    },
  },
  execute: async ({ orderNumber, orderId } = {}, tool_context) => {
    const { businessId, customerId } = getToolSessionState(tool_context);
    if (!businessId) return { success: false, error: "MISSING_BUSINESS_ID", message: "Restaurant session context missing." };
    return getOrderTool.execute({ businessId, customerId, orderNumber, orderId });
  },
});

/**
 * ADK FunctionTool wrapper: getCustomerOrders
 */
export const adkGetCustomerOrdersTool = new FunctionTool({
  name: "getCustomerOrders",
  description: "Retrieves recent order history for the current customer.",
  parameters: {
    type: "object",
    properties: {
      limit: {
        type: "number",
        description: "Optional number of past orders to retrieve (default 5)",
      },
    },
  },
  execute: async ({ limit } = {}, tool_context) => {
    const { businessId, customerId } = getToolSessionState(tool_context);
    if (!businessId || !customerId) {
      return { success: false, error: "MISSING_CUSTOMER_CONTEXT", message: "Customer context is required to view order history." };
    }
    return getCustomerOrdersTool.execute({ businessId, customerId, limit });
  },
});

/**
 * ADK FunctionTool wrapper: cancelOrder
 */
export const adkCancelOrderTool = new FunctionTool({
  name: "cancelOrder",
  description: "Cancels an order if it is still in PENDING status. Escalates to human staff if order is already in progress.",
  parameters: {
    type: "object",
    properties: {
      orderNumber: {
        type: "string",
        description: "Order number to cancel (e.g. 'ORD-123456')",
      },
    },
    required: ["orderNumber"],
  },
  execute: async ({ orderNumber } = {}, tool_context) => {
    const { businessId, customerId, conversationId } = getToolSessionState(tool_context);
    if (!businessId) return { success: false, error: "MISSING_BUSINESS_ID", message: "Restaurant session context missing." };
    return cancelOrderTool.execute({ businessId, customerId, conversationId, orderNumber });
  },
});
