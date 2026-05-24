import { Request, Response, NextFunction } from "express";
import { CardListing } from "../models/CardListing";
import { Claim } from "../models/Claim";
import { DefinedCard } from "../models/DefinedCard";
import { User } from "../models/User";
import { decryptText } from "../utils/encryption";
import { config } from "../config";
import { sendClaimNotifyOwner, sendClaimReceiptToClaimer } from "../utils/email";

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

    // Fire-and-forget notifications. Wrapped in an explicit IIFE with logs so
    // debugging "I claimed but no one got an email" is trivial from the
    // backend console. Both legs fire in parallel; either failing doesn't
    // affect the user-facing response.
    const offeringLabel = (listing.offeringCards || []).join(", ") || listing.wantedCard;
    void (async () => {
      try {
        console.log("[claim] notifying owner", {
          listingId: listing.id,
          ownerId: String(listing.createdBy),
          claimerId: user.id
        });
        const owner = await User.findById(listing.createdBy).select("email name").lean<{ email?: string; name?: string }>();
        if (!owner) {
          console.warn("[claim] owner not found, skipping email", { ownerId: String(listing.createdBy) });
          return;
        }
        if (!owner.email) {
          console.warn("[claim] owner has no email on record, skipping email", { ownerId: String(listing.createdBy) });
          return;
        }
        const result = await sendClaimNotifyOwner({
          to: owner.email,
          toName: owner.name,
          offeringCard: offeringLabel,
          claimerName: user.name || user.email
        });
        if (!result.ok) {
          console.warn("[claim] owner email did not send", { to: owner.email, error: result.error });
        }
      } catch (err: any) {
        console.error("[claim] failed to send owner email", err?.message || err);
      }
    })();

    // Receipt email to the claimer — they get the code in their inbox the
    // moment they claim, independent of whether they kept the modal open or
    // copied the code in time.
    void (async () => {
      try {
        if (!user.email) {
          console.warn("[claim] claimer has no email on record, skipping receipt email", { claimerId: user.id });
          return;
        }
        const owner = await User.findById(listing.createdBy).select("name").lean<{ name?: string }>();
        console.log("[claim] sending receipt to claimer", { listingId: listing.id, claimerId: user.id, to: user.email });
        const result = await sendClaimReceiptToClaimer({
          to: user.email,
          toName: user.name,
          offeringCard: offeringLabel,
          wantedCard: listing.wantedCard,
          revealedCode,
          ownerName: owner?.name
        });
        if (!result.ok) {
          console.warn("[claim] claimer receipt did not send", { to: user.email, error: result.error });
        }
      } catch (err: any) {
        console.error("[claim] failed to send claimer receipt", err?.message || err);
      }
    })();

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

// All claims by the authenticated user. Powers the "Claimed" tab in profile.
// Returns the plaintext revealedCode so the user can re-copy it later — same
// security model as showing it in the claim modal (we control authn here).
export async function getMyClaims(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const claims = await Claim.find({ claimedBy: user.id })
      .sort({ createdAt: -1 })
      .populate<{ listingId: any }>({
        path: "listingId",
        populate: { path: "createdBy", select: "name email" }
      })
      .lean();

    const allDefinedCards = await DefinedCard.find().lean();
    const cardMap = new Map(allDefinedCards.map((c) => [c.name, c]));

    const data = claims
      .filter((c: any) => c.listingId)
      .map((c: any) => {
        const listing = c.listingId;
        const owner = listing.createdBy;
        return {
          id: c._id,
          listingId: listing._id,
          revealedCode: c.revealedCode,
          claimedAt: c.createdAt,
          tradeOutcome: listing.tradeOutcome ?? "pending",
          outcomeAt: listing.outcomeAt ?? null,
          disputeReason: listing.disputeReason ?? null,
          wantedCard: listing.wantedCard,
          wantedCardImage: cardMap.get(listing.wantedCard)?.imageUrl ?? "",
          wantedCardType: cardMap.get(listing.wantedCard)?.type ?? "",
          offeringCards: listing.offeringCards || [],
          offeringCardImages: (listing.offeringCards || []).map((name: string) => ({
            name,
            imageUrl: cardMap.get(name)?.imageUrl ?? "",
            type: cardMap.get(name)?.type ?? ""
          })),
          owner: owner ? {
            name: owner.name || owner.email?.split("@")[0] || "User",
            email: owner.email
          } : null
        };
      });

    res.json({ data });
  } catch (error) {
    next(error);
  }
}
