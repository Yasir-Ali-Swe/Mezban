import prisma from "../config/prisma.js";
import { enqueueReindex } from "../ai/rag/index.js";

const DAY_MAP = {
  monday: "MONDAY",
  tuesday: "TUESDAY",
  wednesday: "WEDNESDAY",
  thursday: "THURSDAY",
  friday: "FRIDAY",
  saturday: "SATURDAY",
  sunday: "SUNDAY",
  MONDAY: "MONDAY",
  TUESDAY: "TUESDAY",
  WEDNESDAY: "WEDNESDAY",
  THURSDAY: "THURSDAY",
  FRIDAY: "FRIDAY",
  SATURDAY: "SATURDAY",
  SUNDAY: "SUNDAY",
};

export const getBusinessHours = async (req, res) => {
  try {
    const hours = await prisma.businessHour.findMany({
      where: { businessId: req.businessId },
    });

    return res.status(200).json({
      success: true,
      data: hours,
    });
  } catch (error) {
    console.error("getBusinessHours error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business hours",
      error: error.message,
    });
  }
};

export const updateBusinessHours = async (req, res) => {
  try {
    const hoursPayload = req.body.businessHours || req.body.data?.businessHours || req.body;
    const results = [];

    if (Array.isArray(hoursPayload)) {
      for (const item of hoursPayload) {
        const dayOfWeek = DAY_MAP[item.dayOfWeek];
        if (!dayOfWeek) continue;

        const updated = await prisma.businessHour.upsert({
          where: {
            businessId_dayOfWeek: {
              businessId: req.businessId,
              dayOfWeek,
            },
          },
          update: {
            isOpen: item.isOpen ?? true,
            open: item.open || null,
            close: item.close || null,
          },
          create: {
            businessId: req.businessId,
            dayOfWeek,
            isOpen: item.isOpen ?? true,
            open: item.open || null,
            close: item.close || null,
          },
        });
        results.push(updated);
      }
    } else if (typeof hoursPayload === "object" && hoursPayload !== null) {
      for (const [key, value] of Object.entries(hoursPayload)) {
        const dayOfWeek = DAY_MAP[key];
        if (!dayOfWeek) continue;

        const updated = await prisma.businessHour.upsert({
          where: {
            businessId_dayOfWeek: {
              businessId: req.businessId,
              dayOfWeek,
            },
          },
          update: {
            isOpen: value.isOpen ?? true,
            open: value.open || null,
            close: value.close || null,
          },
          create: {
            businessId: req.businessId,
            dayOfWeek,
            isOpen: value.isOpen ?? true,
            open: value.open || null,
            close: value.close || null,
          },
        });
        results.push(updated);
      }
    }

    // Automatically trigger RAG reindexing for HOURS document in background
    enqueueReindex(req.businessId, "HOURS");

    return res.status(200).json({
      success: true,
      data: results,
      message: "Business hours updated successfully",
    });
  } catch (error) {
    console.error("updateBusinessHours error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update business hours",
      error: error.message,
    });
  }
};
