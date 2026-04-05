import { Router } from "express";
import { createClaim } from "../controllers/claimsController";
import { validateObjectId } from "../middleware/validateObjectId";
import { userRateLimiter } from "../middleware/rateLimit";

export const claimsRouter = Router();

claimsRouter.post("/:listingId", validateObjectId, userRateLimiter, createClaim);
