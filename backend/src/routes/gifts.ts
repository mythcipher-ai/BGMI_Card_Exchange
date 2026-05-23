import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  createGiftRequest,
  getIncomingGiftRequests,
  getOutgoingGiftRequests,
  updateGiftRequestStatus
} from "../controllers/giftsController";
import { validateObjectId } from "../middleware/validateObjectId";

export const giftsRouter = Router();

// Per-user limiter: at most 5 gift requests per 15 minutes
// (the global IP limiter still applies on top).
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id?.toString() || req.ip,
  message: { message: "Too many gift requests. Please try again later." }
});

giftsRouter.get("/incoming", getIncomingGiftRequests);
giftsRouter.get("/outgoing", getOutgoingGiftRequests);
giftsRouter.post("/:listingId", validateObjectId, createLimiter, createGiftRequest);
giftsRouter.patch("/:id/status", validateObjectId, updateGiftRequestStatus);
