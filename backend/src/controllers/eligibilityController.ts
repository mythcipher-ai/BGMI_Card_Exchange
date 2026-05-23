import { Request, Response, NextFunction } from "express";
import { CardListing } from "../models/CardListing";
import { config } from "../config";

/**
 * Frontend uses this to gate UI: can the user create a listing right now?
 * Can they claim? Why or why not?
 */
export async function getMyEligibility(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const active = await CardListing.findOne({ createdBy: user.id, status: "active" }).select("_id").lean();

    let canClaim = true;
    let claimReason: "DAILY_LIMIT" | "COOLDOWN" | null = null;
    const now = new Date();

    if (user.dailyClaimsResetAt && user.dailyClaimsResetAt > now && user.dailyClaims >= config.dailyClaimLimit) {
      canClaim = false;
      claimReason = "DAILY_LIMIT";
    } else if (user.lastClaimedAt && now.getTime() - user.lastClaimedAt.getTime() < config.claimCooldownSeconds * 1000) {
      canClaim = false;
      claimReason = "COOLDOWN";
    }

    res.json({
      data: {
        canCreateListing: !active,
        canClaim,
        activeListingId: active?._id ?? null,
        reason: active ? "ACTIVE_LISTING_EXISTS" : claimReason
      }
    });
  } catch (error) {
    next(error);
  }
}
