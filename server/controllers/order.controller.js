import prisma from "../config/prisma.js";
import { sendTelegramMessage } from "../utils/telegram.sender.js";

const ORDER_STATUS_MAP = {
  pending: "PENDING",
  confirmed: "CONFIRMED",
  preparing: "PREPARING",
  out_for_delivery: "OUT_FOR_DELIVERY",
  completed: "COMPLETED",
  cancelled: "CANCELLED",
  PENDING: "PENDING",
  CONFIRMED: "CONFIRMED",
  PREPARING: "PREPARING",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED",
};

export const getOrders = async (req, res) => {
  try {
    const {
      search = "",
      status = "all",
      dateFrom,
      dateTo,
      page = 1,
      limit = 10,
    } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      businessId: req.businessId,
    };

    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: "insensitive" } },
        { customer: { name: { contains: search, mode: "insensitive" } } },
        { customer: { phone: { contains: search, mode: "insensitive" } } },
      ];
    }

    if (status !== "all" && ORDER_STATUS_MAP[status]) {
      where.status = ORDER_STATUS_MAP[status];
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) {
        const from = new Date(dateFrom);
        from.setHours(0, 0, 0, 0);
        where.createdAt.gte = from;
      }
      if (dateTo) {
        const to = new Date(dateTo);
        to.setHours(23, 59, 59, 999);
        where.createdAt.lte = to;
      }
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          customer: true,
          items: true,
        },
      }),
      prisma.order.count({ where }),
    ]);

    const formatted = orders.map((o) => ({
      _id: o.id,
      id: o.id,
      orderNumber: o.orderNumber,
      customer: {
        _id: o.customer.id,
        name: o.customer.name,
        phone: o.customer.phone || "",
        email: o.customer.email || "",
      },
      total: Number(o.total),
      subtotal: Number(o.subtotal),
      tax: Number(o.tax),
      shipping: Number(o.shipping),
      status: o.status.toLowerCase(),
      orderType: o.orderType.toLowerCase(),
      items: o.items.length,
      createdAt: o.createdAt,
    }));

    return res.status(200).json({
      success: true,
      data: formatted,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("getOrders error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch orders",
      error: error.message,
    });
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: {
        businessId: req.businessId,
        OR: [{ id }, { orderNumber: id }],
      },
      include: {
        customer: true,
        items: true,
      },
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: order.id,
        id: order.id,
        orderNumber: order.orderNumber,
        customer: {
          _id: order.customer.id,
          name: order.customer.name,
          phone: order.customerPhone || order.customer.phone || "",
          email: order.customer.email || "",
          telegramChatId: order.customer.telegramChatId || "",
        },
        status: order.status.toLowerCase(),
        orderType: order.orderType.toLowerCase(),
        paymentMethod: order.paymentMethod || "Cash on Delivery",
        subtotal: Number(order.subtotal),
        tax: Number(order.tax),
        shipping: Number(order.shipping),
        total: Number(order.total),
        notes: order.notes || "",
        shippingAddress: {
          street: order.shippingStreet || "",
          city: order.shippingCity || "",
          state: order.shippingState || "",
          zipCode: order.shippingZipCode || "",
          country: order.shippingCountry || "",
        },
        items: order.items.map((item) => ({
          _id: item.id,
          id: item.id,
          productId: item.menuItemId || item.dealId,
          productName: item.name,
          productImage: item.imageUrl,
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice),
          subtotal: Number(item.subtotal),
        })),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
      },
    });
  } catch (error) {
    console.error("getOrderById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch order details",
      error: error.message,
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const mappedStatus = ORDER_STATUS_MAP[status];
    if (!mappedStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid order status "${status}"`,
      });
    }

    const existing = await prisma.order.findFirst({
      where: {
        businessId: req.businessId,
        OR: [{ id }, { orderNumber: id }],
      },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // Status transition guards
    if (existing.status === "CANCELLED" && mappedStatus !== "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: "Cancelled orders cannot be transitioned to an active status.",
      });
    }

    if (existing.status === "COMPLETED" && mappedStatus !== "COMPLETED") {
      return res.status(400).json({
        success: false,
        message: "Completed orders cannot be transitioned to another status.",
      });
    }

    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: { status: mappedStatus },
      include: { customer: true, items: true },
    });

    const io = req.app?.get("io");
    if (io) {
      io.to(`business-${req.businessId}`).emit("order-status-updated", {
        orderId: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status.toLowerCase(),
        updatedAt: updated.updatedAt,
      });
    }

    // Customer Telegram status notification
    try {
      if (updated.customer?.telegramChatId && mappedStatus !== existing.status) {
        const telegramConfig = await prisma.telegramConfig.findUnique({
          where: { businessId: req.businessId },
        });

        if (telegramConfig?.botToken) {
          const STATUS_NOTIFICATIONS = {
            CONFIRMED: `<b>✅ Order Confirmed!</b>\n\nYour order <code>#${updated.orderNumber}</code> has been confirmed by the restaurant and will be prepared shortly.`,
            PREPARING: `<b>🍳 Order Preparing!</b>\n\nYour order <code>#${updated.orderNumber}</code> is now being freshly prepared in the kitchen.`,
            OUT_FOR_DELIVERY: `<b>🛵 Out for Delivery!</b>\n\nYour order <code>#${updated.orderNumber}</code> is now out for delivery! Our rider is on the way.`,
            COMPLETED: `<b>🎉 Order Delivered!</b>\n\nYour order <code>#${updated.orderNumber}</code> has been delivered. Thank you for ordering with us! Enjoy your meal.`,
            CANCELLED: `<b>❌ Order Cancelled</b>\n\nYour order <code>#${updated.orderNumber}</code> has been cancelled.`,
          };

          const msg = STATUS_NOTIFICATIONS[mappedStatus];
          if (msg) {
            await sendTelegramMessage(telegramConfig.botToken, updated.customer.telegramChatId, msg);
          }
        }
      }
    } catch (notifyErr) {
      console.warn("[Telegram Order Status Notification Error]:", notifyErr.message);
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: updated.id,
        id: updated.id,
        orderNumber: updated.orderNumber,
        status: updated.status.toLowerCase(),
        updatedAt: updated.updatedAt,
      },
      message: `Order status updated to ${mappedStatus.toLowerCase().replace(/_/g, " ")}`,
    });
  } catch (error) {
    console.error("updateOrderStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update order status",
      error: error.message,
    });
  }
};
