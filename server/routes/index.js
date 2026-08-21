import { Router } from "express";
import { requireAuth, requireOnboardingComplete } from "../middleware/auth.middleware.js";
import businessRoutes from "./business.routes.js";
import categoryRoutes from "./category.routes.js";
import menuRoutes from "./menu.routes.js";
import dealRoutes from "./deal.routes.js";
import customerRoutes from "./customer.routes.js";
import orderRoutes from "./order.routes.js";
import telegramRoutes from "./telegram.routes.js";
import dashboardRoutes from "./dashboard.routes.js";
import analyticsRoutes from "./analytics.routes.js";
import conversationRoutes from "./conversation.routes.js";

const router = Router();

// Onboarding accessible APIs (requireAuth executed inside business.routes and telegram.routes)
router.use("/business", businessRoutes);
router.use("/telegram", telegramRoutes);

// Protected Business Management APIs (Require Auth AND Onboarding Completion)
router.use("/categories", requireAuth, requireOnboardingComplete, categoryRoutes);
router.use("/menu", requireAuth, requireOnboardingComplete, menuRoutes);
router.use("/deals", requireAuth, requireOnboardingComplete, dealRoutes);
router.use("/customers", requireAuth, requireOnboardingComplete, customerRoutes);
router.use("/orders", requireAuth, requireOnboardingComplete, orderRoutes);
router.use("/conversations", requireAuth, requireOnboardingComplete, conversationRoutes);
router.use("/dashboard", requireAuth, requireOnboardingComplete, dashboardRoutes);
router.use("/analytics", requireAuth, requireOnboardingComplete, analyticsRoutes);

export default router;
