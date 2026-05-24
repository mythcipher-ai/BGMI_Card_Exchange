/**
 * Reward milestone definitions.
 *
 * The user unlocks a milestone the moment their `successfulTrades` count
 * crosses the threshold. Each milestone can only ever be claimed once
 * (enforced by the unique (userId, milestone) index on RewardRequest).
 *
 * Source of truth: this file. Backend and frontend both derive from the
 * `/api/rewards/milestones` endpoint so we never duplicate the table.
 */

export interface Milestone {
  threshold: number;       // successful trades required to unlock
  popularityReward: number; // BGMI in-game popularity granted (delivered manually by admin)
}

export const MILESTONES: Milestone[] = [
  { threshold: 1,  popularityReward: 1000 },
  { threshold: 3,  popularityReward: 2000 },
  { threshold: 5,  popularityReward: 3000 },
  { threshold: 10, popularityReward: 4000 },
  { threshold: 15, popularityReward: 5000 },
  { threshold: 20, popularityReward: 6000 }
];

export function findMilestone(threshold: number): Milestone | undefined {
  return MILESTONES.find((m) => m.threshold === threshold);
}

import { CardListing } from "../models/CardListing";
import { Claim } from "../models/Claim";
import { Types } from "mongoose";

/**
 * The "effective" trade count used by milestones.
 *
 * Per product requirement: a milestone "trade" is one COMPLETED round trip,
 * meaning the user must have BOTH:
 *   (a) listed a card that another user claimed and the owner (this user)
 *       confirmed received the wanted card  — `listedConfirmed`
 *   (b) claimed someone else's card and that listing's owner confirmed
 *       received the trade  — `claimedConfirmed`
 *
 * One full trade = one pair. So the effective count is the minimum of the
 * two legs.
 *
 *   listedConfirmed = 3, claimedConfirmed = 1 → effective = 1
 *   listedConfirmed = 0, claimedConfirmed = 5 → effective = 0
 *
 * This prevents a user from grinding milestones from only one side of the
 * marketplace.
 */
export async function computeEffectiveTrades(userId: string | Types.ObjectId): Promise<{
  effective: number;
  listedConfirmed: number;
  claimedConfirmed: number;
}> {
  const [listedConfirmed, claimedConfirmed] = await Promise.all([
    CardListing.countDocuments({ createdBy: userId, tradeOutcome: "confirmed" }),
    // A claim only counts when the listing it points at was confirmed by its
    // owner. Aggregating lets us join Claim → CardListing without a second
    // round-trip.
    Claim.aggregate([
      { $match: { claimedBy: new Types.ObjectId(String(userId)) } },
      {
        $lookup: {
          from: "cardlistings",
          localField: "listingId",
          foreignField: "_id",
          as: "listing"
        }
      },
      { $unwind: "$listing" },
      { $match: { "listing.tradeOutcome": "confirmed" } },
      { $count: "n" }
    ]).then((r) => (r[0]?.n as number) ?? 0)
  ]);

  return {
    effective: Math.min(listedConfirmed, claimedConfirmed),
    listedConfirmed,
    claimedConfirmed
  };
}
