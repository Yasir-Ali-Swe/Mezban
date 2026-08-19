import { clerkClient, getAuth } from "@clerk/express";
import prisma from "../config/prisma.js";

export const requireAuth = async (req, res, next) => {
  try {
    const auth = getAuth(req);
    const userId = auth.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    req.userId = userId;

    let clerkProfile = {};
    try {
      const clerkUser = await clerkClient.users.getUser(userId);
      clerkProfile = {
        email: clerkUser.emailAddresses?.[0]?.emailAddress || null,
        firstName: clerkUser.firstName || null,
        lastName: clerkUser.lastName || null,
        username: clerkUser.username || null,
        imageUrl: clerkUser.imageUrl || null,
      };
    } catch (clerkErr) {
      console.warn("Clerk profile lookup note:", clerkErr.message);
    }

    // Find user with business
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { business: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: clerkProfile.email,
          firstName: clerkProfile.firstName,
          lastName: clerkProfile.lastName,
          username: clerkProfile.username,
          imageUrl: clerkProfile.imageUrl,
          business: {
            create: {
              onboardingCompleted: false,
              onboardingStep: 1,
            },
          },
        },
        include: { business: true },
      });
    } else {
      // Synchronize local User profile fields if updated in Clerk
      const profileUpdates = {};
      if (clerkProfile.email && user.email !== clerkProfile.email) profileUpdates.email = clerkProfile.email;
      if (clerkProfile.firstName && user.firstName !== clerkProfile.firstName) profileUpdates.firstName = clerkProfile.firstName;
      if (clerkProfile.lastName && user.lastName !== clerkProfile.lastName) profileUpdates.lastName = clerkProfile.lastName;
      if (clerkProfile.username && user.username !== clerkProfile.username) profileUpdates.username = clerkProfile.username;
      if (clerkProfile.imageUrl && user.imageUrl !== clerkProfile.imageUrl) profileUpdates.imageUrl = clerkProfile.imageUrl;

      if (Object.keys(profileUpdates).length > 0) {
        user = await prisma.user.update({
          where: { id: userId },
          data: profileUpdates,
          include: { business: true },
        });
      }

      if (!user.business) {
        const business = await prisma.business.create({
          data: {
            userId: user.id,
            onboardingCompleted: false,
            onboardingStep: 1,
          },
        });
        user.business = business;
      }
    }

    req.user = user;
    req.businessId = user.business.id;
    req.business = user.business;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
};

export const requireOnboardingComplete = (req, res, next) => {
  if (!req.business || !req.business.onboardingCompleted) {
    return res.status(403).json({
      success: false,
      onboardingRequired: true,
      message: "Onboarding must be completed before accessing this resource.",
    });
  }
  next();
};
