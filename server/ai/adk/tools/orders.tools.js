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
  description: "Creates a new customer order for menu items or deals.",
  parameters: {
    type: "object",
    properties: {
      items: {
        type: "array",
        description: "List of items to order with name and quantity",
        items: {
          type: "object",
          properties: {
            name: { type: "string", description: "Item or deal name" },
            quantity: { type: "number", description: "Quantity to order" },
            menuItemId: { type: "string", description: "Optional menu item ID" },
            dealId: { type: "string", description: "Optional deal ID" },
          },
          required: ["name"],
        },
      },
      orderType: {
        type: "string",
        description: "DELIVERY or DINE_IN",
        enum: ["DELIVERY", "DINE_IN"],
      },
      shippingAddress: {
        type: "string",
        description: "Delivery address (for DELIVERY orders)",
      },
      notes: {
        type: "string",
        description: "Special instructions for the kitchen or delivery",
      },
    },
    required: ["items"],
  },
  execute: async ({ items, orderType, shippingAddress, notes } = {}, tool_context) => {
    const { businessId, customerId } = getToolSessionState(tool_context);
    if (!businessId || !customerId) return { error: "Customer context is required to place an order." };
    return createOrderTool.execute({ businessId, customerId, items, orderType, shippingAddress, notes });
  },
});

/**
 * ADK FunctionTool wrapper: getOrder
 */
export const adkGetOrderTool = new FunctionTool({
  name: "getOrder",
  description: "Retrieves status, total price, and item breakdown for an existing order by order number or ID.",
  parameters: {
    type: "object",
    properties: {
      orderNumber: {
        type: "string",
        description: "Order number (e.g. ORD-123456)",
      },
      orderId: {
        type: "string",
        description: "Optional order database ID",
      },
    },
  },
  execute: async ({ orderNumber, orderId } = {}, tool_context) => {
    const { businessId } = getToolSessionState(tool_context);
    if (!businessId) return { error: "Missing restaurant context" };
    return getOrderTool.execute({ businessId, orderNumber, orderId });
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
    properties: {},
  },
  execute: async (_args, tool_context) => {
    const { businessId, customerId } = getToolSessionState(tool_context);
    if (!businessId || !customerId) return { error: "Customer context is required to view order history." };
    return getCustomerOrdersTool.execute({ businessId, customerId });
  },
});

/**
 * ADK FunctionTool wrapper: cancelOrder
 */
export const adkCancelOrderTool = new FunctionTool({
  name: "cancelOrder",
  description: "Cancels an order if it is still pending confirmation.",
  parameters: {
    type: "object",
    properties: {
      orderNumber: {
        type: "string",
        description: "Order number to cancel (e.g. ORD-123456)",
      },
    },
    required: ["orderNumber"],
  },
  execute: async ({ orderNumber } = {}, tool_context) => {
    const { businessId, customerId } = getToolSessionState(tool_context);
    if (!businessId) return { error: "Missing restaurant context" };
    return cancelOrderTool.execute({ businessId, customerId, orderNumber });
  },
});
