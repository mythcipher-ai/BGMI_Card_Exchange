import { Request, Response, NextFunction } from "express";
import { CardListing } from "../models/CardListing";
import { Claim } from "../models/Claim";
import { User } from "../models/User";
import { decryptText } from "../utils/encryption";
import { config } from "../config";
import { sendClaimNotifyOwner } from "../utils/email";

function getNextMidnight(): Date {
  const next = new Date();
  next.setUTCHours(24, 0, 0, 0);
  next.setUTCMinutes(0, 0);
  next.setUTCSeconds(0, 0);
  next.setUTCMilliseconds(0);
  return next;
}

export async function createClaim(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    const listingId = req.params.listingId;

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const now = new Date();
    if (!user.dailyClaimsResetAt || user.dailyClaimsResetAt <= now) {
      user.dailyClaims = 0;
      user.dailyClaimsResetAt = getNextMidnight();
    }

    if (user.dailyClaims >= config.dailyClaimLimit) {
      return res.status(429).json({ message: "Daily claim limit reached" });
    }

    if (user.lastClaimedAt && now.getTime() - user.lastClaimedAt.getTime() < config.claimCooldownSeconds * 1000) {
      return res.status(429).json({ message: `Please wait ${config.claimCooldownSeconds} seconds between claims.` });
    }

    const listing = await CardListing.findOneAndUpdate(
      {
        _id: listingId,
        status: "active",
        hidden: false,
        expiresAt: { $gt: now },
        createdBy: { $ne: user.id }
      },
      {
        $set: {
          status: "claimed",
          tradeOutcome: "pending",
          claimedBy: user.id,
          claimedAt: now
        },
        $inc: { claimCount: 1 }
      },
      { new: true }
    );

    if (!listing) {
      const own = await CardListing.findOne({ _id: listingId, createdBy: user.id, status: "active" });
      if (own) {
        return res.status(403).json({ message: "You cannot claim your own listing" });
      }
      return res.status(404).json({ message: "Listing is no longer available" });
    }

    const revealedCode = decryptText(listing.code);

    await Claim.create({
      listingId: listing._id,
      claimedBy: user.id,
      revealedCode,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] as string
    });

    user.totalClaims += 1;
    user.lastClaimedAt = now;
    user.dailyClaims += 1;
    await user.save();

    // Free the owner's active-listing slot. successfulTrades is NOT bumped
    // here anymore — it only ticks up when the owner confirms receipt via
    // POST /api/listings/:id/confirm-received. See listingsController.
    await User.findByIdAndUpdate(listing.createdBy, { $set: { hasActiveListing: false } });

    // Fire-and-forget owner notification asking them to confirm the trade.
    User.findById(listing.createdBy).select("email name").lean().then((owner: any) => {
      if (owner?.email) {
        sendClaimNotifyOwner({
          to: owner.email,
          toName: owner.name,
          // Mention every card they were offering (the buyer picks one in-game).
          offeringCard: (listing.offeringCards || []).join(", ") || listing.wantedCard,
          claimerName: user.name || user.email
        }).catch(() => { /* silent */ });
      }
    }).catch(() => { /* silent */ });

    res.json({
      listingId: listing.id,
      status: listing.status,
      revealedCode,
      message: "Claim successful. This action is irreversible."
    });
  } catch (error) {
    next(error);
  }
}
