import prisma from "../config/prisma.js";
import { enqueueReindex } from "../ai/rag/index.js";

export const getBusinessKnowledge = async (req, res) => {
  try {
    const knowledge = await prisma.businessKnowledge.findUnique({
      where: { businessId: req.businessId },
    });

    return res.status(200).json({
      success: true,
      data: knowledge || null,
    });
  } catch (error) {
    console.error("getBusinessKnowledge error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business knowledge",
      error: error.message,
    });
  }
};

export const updateBusinessKnowledge = async (req, res) => {
  try {
    const {
      businessIdentity,
      foodVariety,
      deliveryInformation,
      paymentInformation,
      reservationInformation,
    } = req.body.data || req.body;

    const knowledge = await prisma.businessKnowledge.upsert({
      where: { businessId: req.businessId },
      update: {
        ...(businessIdentity !== undefined && { businessIdentity }),
        ...(foodVariety !== undefined && { foodVariety }),
        ...(deliveryInformation !== undefined && { deliveryInformation }),
        ...(paymentInformation !== undefined && { paymentInformation }),
        ...(reservationInformation !== undefined && { reservationInformation }),
      },
      create: {
        businessId: req.businessId,
        businessIdentity: businessIdentity || "",
        foodVariety: foodVariety || "",
        deliveryInformation: deliveryInformation || "",
        paymentInformation: paymentInformation || "",
        reservationInformation: reservationInformation || "",
      },
    });

    // Automatically trigger RAG reindexing in background
    enqueueReindex(req.businessId);

    return res.status(200).json({
      success: true,
      data: knowledge,
      message: "Business knowledge updated successfully",
    });
  } catch (error) {
    console.error("updateBusinessKnowledge error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update business knowledge",
      error: error.message,
    });
  }
};
