import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import {
  getBusinessProfile,
  updateBusinessProfile,
  getOnboardingStatus,
  completeOnboarding,
} from "../controllers/business.controller.js";
import {
  getBusinessKnowledge,
  updateBusinessKnowledge,
} from "../controllers/businessKnowledge.controller.js";
import {
  getBusinessHours,
  updateBusinessHours,
} from "../controllers/businessHours.controller.js";

const router = Router();

router.use(requireAuth);

router.get("/onboarding-status", getOnboardingStatus);
router.post("/complete-onboarding", completeOnboarding);

router.route("/").get(getBusinessProfile).patch(updateBusinessProfile).put(updateBusinessProfile);
router.route("/knowledge").get(getBusinessKnowledge).put(updateBusinessKnowledge).post(updateBusinessKnowledge);
router.route("/hours").get(getBusinessHours).put(updateBusinessHours).post(updateBusinessHours);

export default router;
