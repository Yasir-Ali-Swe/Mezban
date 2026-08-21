import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getCustomers,
  getCustomerById,
  getCustomerStats,
} from "../controllers/customer.controller.js";

const router = Router();

router.use(requireAuth);

router.route("/stats").get(getCustomerStats);
router.route("/").get(getCustomers);
router.route("/:id").get(getCustomerById);

export default router;
