import prisma from "../config/prisma.js";
import { enqueueReindex } from "../ai/rag/index.js";

export const getBusinessProfile = async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.businessId },
    });

    if (!business) {
      return res.status(404).json({
        success: false,
        message: "Business profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: business,
    });
  } catch (error) {
    console.error("getBusinessProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch business profile",
      error: error.message,
    });
  }
};

export const updateBusinessProfile = async (req, res) => {
  try {
    const { name, email, phone, address, city, country, website, imageUrl } = req.body;

    const updated = await prisma.business.update({
      where: { id: req.businessId },
      data: {
        ...(name !== undefined && { name }),
        ...(email !== undefined && { email }),
        ...(phone !== undefined && { phone }),
        ...(address !== undefined && { address }),
        ...(city !== undefined && { city }),
        ...(country !== undefined && { country }),
        ...(website !== undefined && { website }),
        ...(imageUrl !== undefined && { imageUrl }),
      },
    });

    // Automatically trigger RAG reindexing for BUSINESS document in background
    enqueueReindex(req.businessId, "BUSINESS");

    return res.status(200).json({
      success: true,
      data: updated,
      message: "Business profile updated successfully",
    });
  } catch (error) {
    console.error("updateBusinessProfile error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update business profile",
      error: error.message,
    });
  }
};

export const getOnboardingStatus = async (req, res) => {
  try {
    const business = await prisma.business.findUnique({
      where: { id: req.businessId },
      select: {
        id: true,
        onboardingCompleted: true,
        onboardingStep: true,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        onboardingCompleted: Boolean(business?.onboardingCompleted),
        onboardingStep: business?.onboardingStep || 1,
      },
    });
  } catch (error) {
    console.error("getOnboardingStatus error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch onboarding status",
      error: error.message,
    });
  }
};

export const completeOnboarding = async (req, res) => {
  try {
    const updated = await prisma.business.update({
      where: { id: req.businessId },
      data: {
        onboardingCompleted: true,
        onboardingStep: 3,
      },
    });

    return res.status(200).json({
      success: true,
      data: {
        onboardingCompleted: true,
        onboardingStep: 3,
      },
      message: "Onboarding completed successfully!",
    });
  } catch (error) {
    console.error("completeOnboarding error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to complete onboarding",
      error: error.message,
    });
  }
};
