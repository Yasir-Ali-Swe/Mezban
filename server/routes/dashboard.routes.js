import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { getDashboardStats } from "../controllers/dashboard.controller.js";

const router = Router();

router.use(requireAuth);

router.route("/").get(getDashboardStats);
router.route("/stats").get(getDashboardStats);

export default router;
