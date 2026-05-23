import { Request, Response, NextFunction } from "express";
import { CardListing } from "../models/CardListing";
import { User } from "../models/User";

/**
 * Public, unprotected sweep endpoint.
 *
 * Intentionally has:
 *   - NO authentication
 *   - NO authorization
 *   - NO rate limiting (mounted outside the global IP limiter in app.ts)
 *
 * That's deliberate per spec: this endpoint is designed to be safe to call
 * from any cron / uptime monitor / browser request. It is idempotent —
 * calling it many times in a row only ever marks the same set of expired
 * listings expired once.
 *
 * What it does:
 *   1. Finds active listings whose `expiresAt` is in the past.
 *   2. Marks them as "expired".
 *   3. For every owner of an expired listing, if they no longer have any
 *      active listing, clears their `hasActiveListing` flag so they can
 *      list a new card.
 *
 * Listings now default to a 70-hour TTL (BGMI in-game trade codes are good
 * for ~72h, so 70h leaves a 2-hour buffer for the claimant to redeem).
 */
export async function expireListings(_req: Request, res: Response, next: NextFunction) {
  try {
    const now = new Date();

    // Find candidates first so we know which users to recompute.
    const candidates = await CardListing.find({
      status: "active",
      expiresAt: { $lte: now }
    }).select("_id createdBy").lean();

    if (candidates.length === 0) {
      return res.json({ expired: 0, message: "No listings to expire" });
    }

    const ids = candidates.map((c) => c._id);
    const ownerIds = [...new Set(candidates.map((c) => c.createdBy.toString()))];

    await CardListing.updateMany(
      { _id: { $in: ids }, status: "active" },
      { $set: { status: "expired" } }
    );

    // Free the per-user slot if the expired listing was the user's only active one.
    let slotsFreed = 0;
    for (const uid of ownerIds) {
      const stillActive = await CardListing.exists({ createdBy: uid, status: "active" });
      if (!stillActive) {
        await User.findByIdAndUpdate(uid, { $set: { hasActiveListing: false } });
        slotsFreed += 1;
      }
    }

    res.json({
      expired: candidates.length,
      slotsFreed,
      checkedAt: now.toISOString()
    });
  } catch (error) {
    next(error);
  }
}
