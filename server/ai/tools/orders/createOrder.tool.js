import prisma from "../../../config/prisma.js";

export const createOrderTool = {
  name: "createOrder",
  description: "Creates a new customer order for menu items or deals.",
  execute: async ({ businessId, customerId, items = [], orderType = "DELIVERY", shippingAddress, notes }) => {
    if (!customerId) return { error: "Customer context is required to place an order." };
    if (!items || items.length === 0) return { error: "Order items list cannot be empty." };

    // Resolve order items
    let subtotal = 0;
    const orderItemsData = [];

    for (const item of items) {
      const quantity = Math.max(1, parseInt(item.quantity) || 1);

      // Check menu item
      if (item.menuItemId || item.name) {
        const menuItem = await prisma.menuItem.findFirst({
          where: {
            businessId,
            ...(item.menuItemId ? { id: item.menuItemId } : { name: { contains: item.name, mode: "insensitive" } }),
          },
        });

        if (menuItem) {
          const itemSubtotal = Number(menuItem.sellingPrice) * quantity;
          subtotal += itemSubtotal;
          orderItemsData.push({
            menuItemId: menuItem.id,
            name: menuItem.name,
            imageUrl: menuItem.imageUrl,
            quantity,
            unitPrice: menuItem.sellingPrice,
            subtotal: itemSubtotal,
          });
          continue;
        }
      }

      // Check deal
      if (item.dealId || item.name) {
        const deal = await prisma.deal.findFirst({
          where: {
            businessId,
            ...(item.dealId ? { id: item.dealId } : { name: { contains: item.name, mode: "insensitive" } }),
          },
        });

        if (deal) {
          const dealSubtotal = Number(deal.sellingPrice) * quantity;
          subtotal += dealSubtotal;
          orderItemsData.push({
            dealId: deal.id,
            name: deal.name,
            imageUrl: deal.imageUrl,
            quantity,
            unitPrice: deal.sellingPrice,
            subtotal: dealSubtotal,
          });
          continue;
        }
      }
    }

    if (orderItemsData.length === 0) {
      return { error: "Could not find requested items on the menu." };
    }

    const orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
    const tax = 0;
    const shipping = orderType === "DELIVERY" ? 150 : 0;
    const total = subtotal + tax + shipping;

    const order = await prisma.order.create({
      data: {
        businessId,
        customerId,
        orderNumber,
        status: "PENDING",
        orderType,
        subtotal,
        tax,
        shipping,
        total,
        notes: notes || null,
        shippingCity: shippingAddress || "Lahore",
        items: {
          create: orderItemsData,
        },
      },
      include: { items: true },
    });

    return {
      success: true,
      orderNumber: order.orderNumber,
      orderId: order.id,
      total: Number(order.total),
      subtotal: Number(order.subtotal),
      shipping: Number(order.shipping),
      status: order.status,
      items: order.items.map((i) => `${i.quantity}x ${i.name} (Rs. ${Number(i.subtotal)})`),
    };
  },
};
