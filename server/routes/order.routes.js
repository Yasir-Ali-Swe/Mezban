import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getOrders,
  getOrderById,
  updateOrderStatus,
} from "../controllers/order.controller.js";

const router = Router();

router.use(requireAuth);

router.route("/").get(getOrders);
router.route("/:id").get(getOrderById).patch(updateOrderStatus).put(updateOrderStatus);
router.route("/:id/status").patch(updateOrderStatus).put(updateOrderStatus);

export default router;
