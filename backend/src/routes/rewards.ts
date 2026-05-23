import { Router } from "express";
import rateLimit from "express-rate-limit";
import { getMyMilestones, claimMilestone } from "../controllers/rewardsController";

export const rewardsRouter = Router();

// At most 5 claim submissions per 15 min per user — covers retries without
// allowing scripted abuse. The unique (userId, milestone) index is the real
// defense; this just rate-bounds the attempts.
const claimLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => req.user?.id?.toString() || req.ip,
  message: { message: "Too many reward submissions. Please try again later." }
});

rewardsRouter.get("/milestones", getMyMilestones);
rewardsRouter.post("/claim", claimLimiter, claimMilestone);
