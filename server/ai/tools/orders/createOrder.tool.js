import prisma from "../../../config/prisma.js";

/**
 * Creates a new customer order with full database validation and Prisma transaction.
 *
 * Rules:
 * 1. Multi-tenant scoped by businessId.
 * 2. Customer validated by customerId and businessId.
 * 3. Menu items must be AVAILABLE and Category ACTIVE.
 * 4. Deals must be ACTIVE.
 * 5. Prices fetched strictly from database (never LLM supplied).
 * 6. Executed inside an atomic Prisma $transaction.
 */
export const createOrderTool = {
  name: "createOrder",
  description: "Creates a new customer order for menu items or deals.",
  execute: async ({
    businessId,
    customerId,
    conversationId,
    items = [],
    orderType = "DELIVERY",
    paymentMethod = "Cash on Delivery",
    shippingAddress,
    customerPhone,
    phone,
    notes,
  }) => {
    if (!businessId) {
      return { success: false, error: "MISSING_BUSINESS_ID", message: "Business ID is required." };
    }

    if (!customerId) {
      return { success: false, error: "MISSING_CUSTOMER_ID", message: "Customer context is required to place an order." };
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return { success: false, error: "EMPTY_ITEMS", message: "Order items list cannot be empty. Please specify dishes to order." };
    }

    // 1. Verify Customer exists and belongs to business
    const customer = await prisma.customer.findFirst({
      where: { id: customerId, businessId },
    });

    if (!customer) {
      return { success: false, error: "CUSTOMER_NOT_FOUND", message: "Customer profile not found for this restaurant." };
    }

    // Normalize order type (DELIVERY, PICKUP, DINE_IN)
    const validOrderType = ["DELIVERY", "PICKUP", "DINE_IN"].includes(orderType?.toUpperCase())
      ? orderType.toUpperCase()
      : "DELIVERY";

    // 2. Validate all items and build OrderItems data
    let subtotal = 0;
    const orderItemsData = [];

    for (const rawItem of items) {
      const quantity = Math.max(1, parseInt(rawItem.quantity) || 1);
      const itemName = (rawItem.name || "").trim();
      const itemId = rawItem.menuItemId || rawItem.id;
      const dealId = rawItem.dealId;

      let resolved = false;

      // Check Menu Item first
      if (itemId || itemName) {
        const menuItem = await prisma.menuItem.findFirst({
          where: {
            businessId,
            ...(itemId ? { id: itemId } : { name: { contains: itemName, mode: "insensitive" } }),
          },
          include: { category: true },
        });

        if (menuItem) {
          // Check availability
          if (menuItem.status !== "AVAILABLE") {
            return {
              success: false,
              error: "ITEM_UNAVAILABLE",
              message: `'${menuItem.name}' is currently unavailable/out of stock and cannot be ordered.`,
            };
          }

          if (menuItem.category && menuItem.category.status !== "ACTIVE") {
            return {
              success: false,
              error: "CATEGORY_INACTIVE",
              message: `'${menuItem.name}' belongs to an inactive category and cannot be ordered.`,
            };
          }

          const price = Number(menuItem.sellingPrice);
          const lineSubtotal = price * quantity;
          subtotal += lineSubtotal;

          orderItemsData.push({
            menuItemId: menuItem.id,
            name: menuItem.name,
            imageUrl: menuItem.imageUrl,
            quantity,
            unitPrice: price,
            subtotal: lineSubtotal,
          });

          resolved = true;
        }
      }

      // Check Deal if not resolved as menu item
      if (!resolved && (dealId || itemName)) {
        const deal = await prisma.deal.findFirst({
          where: {
            businessId,
            ...(dealId ? { id: dealId } : { name: { contains: itemName, mode: "insensitive" } }),
          },
        });

        if (deal) {
          if (deal.status !== "ACTIVE") {
            return {
              success: false,
              error: "DEAL_INACTIVE",
              message: `Deal '${deal.name}' is currently inactive and cannot be ordered.`,
            };
          }

          const price = Number(deal.sellingPrice);
          const lineSubtotal = price * quantity;
          subtotal += lineSubtotal;

          orderItemsData.push({
            dealId: deal.id,
            name: deal.name,
            imageUrl: deal.imageUrl,
            quantity,
            unitPrice: price,
            subtotal: lineSubtotal,
          });

          resolved = true;
        }
      }

      if (!resolved) {
        return {
          success: false,
          error: "ITEM_NOT_FOUND",
          message: `Item or deal '${itemName || itemId || dealId}' is not found on the menu.`,
        };
      }
    }

    if (orderItemsData.length === 0) {
      return { success: false, error: "NO_VALID_ITEMS", message: "No valid items could be added to the order." };
    }

    // 3. Compute totals
    const shipping = validOrderType === "DELIVERY" ? 150 : 0;
    const tax = 0;
    const total = subtotal + shipping + tax;

    // Generate unique order number (e.g. ORD-M1AB2-5432)
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const timePart = Date.now().toString(36).toUpperCase().slice(-5);
    const orderNumber = `ORD-${timePart}-${randomSuffix}`;

    // 4. Atomic Prisma Transaction
    try {
      const order = await prisma.$transaction(async (tx) => {
        // Persist customer phone if provided or extracted from notes
        const extractedPhoneFromNotes = (notes || "").match(/(?:03\d{2}[-\s]?\d{7}|\+92[-\s]?3\d{2}[-\s]?\d{7}|\b\d{10,12}\b)/)?.[0];
        const resolvedPhone = (customerPhone || phone || extractedPhoneFromNotes || "").trim();

        if (resolvedPhone && (!customer.phone || customer.phone !== resolvedPhone)) {
          await tx.customer.update({
            where: { id: customerId },
            data: { phone: resolvedPhone },
          });
        }

        return tx.order.create({
          data: {
            businessId,
            customerId,
            conversationId: conversationId || null,
            orderNumber,
            status: "PENDING",
            orderType: validOrderType,
            paymentMethod: paymentMethod || "Cash on Delivery",
            customerPhone: resolvedPhone || customer.phone || null,
            subtotal,
            tax,
            shipping,
            total,
            notes: notes || null,
            shippingStreet: shippingAddress || null,
            shippingCity: null,
            items: {
              create: orderItemsData,
            },
          },
          include: {
            items: true,
            customer: true,
          },
        });
      });

      return {
        success: true,
        orderNumber: order.orderNumber,
        orderId: order.id,
        status: order.status,
        orderType: order.orderType,
        paymentMethod: order.paymentMethod || paymentMethod || "Cash on Delivery",
        customerName: order.customer?.name || "Customer",
        customerPhone: order.customerPhone || order.customer?.phone || "N/A",
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping),
        tax: Number(order.tax),
        total: Number(order.total),
        items: order.items.map((i) => ({
          name: i.name,
          quantity: i.quantity,
          unitPrice: Number(i.unitPrice),
          subtotal: Number(i.subtotal),
          isDeal: Boolean(i.dealId),
        })),
        shippingAddress: order.shippingStreet || order.shippingCity || "N/A",
        message: `Order #${order.orderNumber} placed successfully! Total: Rs. ${Number(order.total)}. Payment Method: ${order.paymentMethod || "Cash on Delivery"}. Status is currently PENDING confirmation.`,
      };
    } catch (err) {
      console.error("[createOrder Error]:", err);
      return {
        success: false,
        error: "ORDER_CREATION_FAILED",
        message: "Failed to place the order due to a system error. Please try again.",
      };
    }
  },
};
