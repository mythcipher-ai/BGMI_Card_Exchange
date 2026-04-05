import { Router } from "express";
import { createReport } from "../controllers/reportsController";
import { validateObjectId } from "../middleware/validateObjectId";
import { userRateLimiter } from "../middleware/rateLimit";

export const reportsRouter = Router();

reportsRouter.post("/:listingId", validateObjectId, userRateLimiter, createReport);
