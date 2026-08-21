import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { upload } from "../middleware/upload.middleware.js";
import {
  getMenuItems,
  getMenuStats,
  getMenuItemById,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
} from "../controllers/menu.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getMenuStats);

router.route("/").get(getMenuItems).post(upload.single("image"), createMenuItem);
router.route("/:id").get(getMenuItemById).patch(upload.single("image"), updateMenuItem).put(upload.single("image"), updateMenuItem).delete(deleteMenuItem);

export default router;
