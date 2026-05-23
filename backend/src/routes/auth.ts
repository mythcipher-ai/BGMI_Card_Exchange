import { Router } from "express";
import { getMe, syncProfile } from "../controllers/authController";
import { getMyEligibility } from "../controllers/eligibilityController";

export const authRouter = Router();

authRouter.get("/", getMe);
authRouter.post("/sync", syncProfile);
authRouter.get("/eligibility", getMyEligibility);
