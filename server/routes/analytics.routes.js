import { Router } from "express";
import {
  getBusinessAnalytics,
  getAiAnalytics,
} from "../controllers/analytics.controller.js";

const router = Router();

router.get("/business", getBusinessAnalytics);
router.get("/ai", getAiAnalytics);

export default router;
