import { Router } from "express";
import { getMe, syncProfile } from "../controllers/authController";
import { getMyEligibility } from "../controllers/eligibilityController";
import { getMyClaims } from "../controllers/claimsController";
import { getPendingConfirmations } from "../controllers/listingsController";

export const authRouter = Router();

authRouter.get("/", getMe);
authRouter.post("/sync", syncProfile);
authRouter.get("/eligibility", getMyEligibility);
authRouter.get("/claimed", getMyClaims);
authRouter.get("/pending-confirmations", getPendingConfirmations);
