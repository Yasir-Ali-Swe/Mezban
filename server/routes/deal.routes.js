import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  getDeals,
  getDealStats,
  getDealById,
  createDeal,
  updateDeal,
  deleteDeal,
} from "../controllers/deal.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getDealStats);

router.route("/").get(getDeals).post(upload.single("image"), createDeal);
router.route("/:id").get(getDealById).patch(upload.single("image"), updateDeal).put(upload.single("image"), updateDeal).delete(deleteDeal);

export default router;
