import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getCategories,
  getCategoryStats,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/stats", getCategoryStats);

router.route("/").get(getCategories).post(createCategory);
router.route("/:id").patch(updateCategory).put(updateCategory).delete(deleteCategory);

export default router;
