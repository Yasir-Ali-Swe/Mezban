import prisma from "../config/prisma.js";

export const getCustomerStats = async (req, res) => {
  try {
    const where = { businessId: req.businessId };
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totalCustomers, telegramConnected, newThisMonth] = await Promise.all([
      prisma.customer.count({ where }),
      prisma.customer.count({
        where: {
          ...where,
          telegramChatId: { not: null },
        },
      }),
      prisma.customer.count({
        where: {
          ...where,
          createdAt: { gte: startOfMonth },
        },
      }),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        totalCustomers,
        telegramConnected,
        newThisMonth,
      },
    });
  } catch (error) {
    console.error("getCustomerStats error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer statistics",
      error: error.message,
    });
  }
};

export const getCustomers = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 10 } = req.query;

    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where = {
      businessId: req.businessId,
    };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: "desc" },
        include: {
          _count: {
            select: { orders: true },
          },
          conversations: {
            orderBy: { lastActivity: "desc" },
            take: 1,
            select: { id: true, status: true },
          },
        },
      }),
      prisma.customer.count({ where }),
    ]);

    const formatted = customers.map((c) => ({
      _id: c.id,
      id: c.id,
      name: c.name,
      phone: c.phone || "",
      email: c.email || "",
      telegramChatId: c.telegramChatId || null,
      latestConversationId: c.conversations[0]?.id || null,
      conversationId: c.conversations[0]?.id || null,
      orderCount: c._count.orders,
      orders: c._count.orders,
      createdAt: c.createdAt,
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
    console.error("getCustomers error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customers",
      error: error.message,
    });
  }
};

export const getCustomerById = async (req, res) => {
  try {
    const { id } = req.params;

    const customer = await prisma.customer.findFirst({
      where: { id, businessId: req.businessId },
      include: {
        orders: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        conversations: {
          orderBy: { lastActivity: "desc" },
          take: 5,
        },
      },
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: "Customer not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: customer.id,
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        telegramChatId: customer.telegramChatId,
        orders: customer.orders.map((o) => ({
          _id: o.id,
          orderNumber: o.orderNumber,
          total: Number(o.total),
          status: o.status.toLowerCase(),
          createdAt: o.createdAt,
        })),
        createdAt: customer.createdAt,
      },
    });
  } catch (error) {
    console.error("getCustomerById error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch customer",
      error: error.message,
    });
  }
};
