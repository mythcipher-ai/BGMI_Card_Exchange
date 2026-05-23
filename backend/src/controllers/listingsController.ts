import { Request, Response, NextFunction } from "express";
import { CardListing } from "../models/CardListing";
import { Claim } from "../models/Claim";
import { DefinedCard } from "../models/DefinedCard";
import { User } from "../models/User";
import { encryptText, hashCode, maskCode } from "../utils/encryption";
import { sendTradeConfirmedToClaimer, sendTradeDisputedToClaimer } from "../utils/email";

export async function createListing(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const { offeringCardIds, wantedCardId, code, expiresInHours } = req.body ?? {};

    if (
      !Array.isArray(offeringCardIds) ||
      offeringCardIds.length === 0 ||
      offeringCardIds.length > 3 ||
      !wantedCardId ||
      typeof wantedCardId !== "string" ||
      !code
    ) {
      return res.status(400).json({ message: "Invalid listing payload" });
    }

    // BGMI in-game trade codes are exactly 8 digits. Enforced both sides.
    if (!/^\d{8}$/.test(code)) {
      return res.status(400).json({ message: "Code must be exactly 8 digits" });
    }

    // ---- One-active-listing-per-user pre-check ----
    // Bouncer for nice 409 messaging; the partial unique index is the canonical defense.
    const existingActive = await CardListing.findOne({ createdBy: user.id, status: "active" }).lean();
    if (existingActive) {
      return res.status(409).json({
        code: "ACTIVE_LISTING_EXISTS",
        message: "You already have an active card listing. Delete it before creating a new one.",
        existingId: existingActive._id
      });
    }

    // ---- Duplicate-code checks ----
    // Use a deterministic hash so we can index/query without storing plaintext.
    const codeHash = hashCode(code);

    // (a) The same code is currently active on the platform under any user.
    const activeDuplicate = await CardListing.findOne({ codeHash, status: "active" }).lean();
    if (activeDuplicate) {
      return res.status(409).json({
        code: "CODE_IN_USE",
        message: "This trade code is already active on the platform. Generate a fresh one in-game."
      });
    }

    // (b) The same user has listed this exact code before (even if expired/claimed).
    const historicDuplicate = await CardListing.findOne({ codeHash, createdBy: user.id }).lean();
    if (historicDuplicate) {
      return res.status(409).json({
        code: "CODE_ALREADY_USED",
        message: "You have already listed this code before. Generate a new code from BGMI."
      });
    }

    // Resolve all offering cards + the wanted card to their canonical names.
    const offeringDefs = await DefinedCard.find({ _id: { $in: offeringCardIds } }).lean();
    if (offeringDefs.length !== offeringCardIds.length) {
      return res.status(400).json({ message: "Invalid offering card(s)" });
    }
    const wantedDef = await DefinedCard.findById(wantedCardId).lean();
    if (!wantedDef) {
      return res.status(400).json({ message: "Invalid wanted card" });
    }
    if (offeringDefs.some((d) => d._id.toString() === wantedDef._id.toString())) {
      return res.status(400).json({ message: "Wanted card cannot be one of your offered cards" });
    }

    // BGMI in-game trade codes are valid for ~3 days (72h). We expire listings
    // a couple of hours earlier (70h) so a claimant always has a buffer to
    // redeem before the in-game code dies.
    const expiresAt = new Date(Date.now() + (Number(expiresInHours) || 70) * 60 * 60 * 1000);
    const encryptedCode = encryptText(code);

    const offeringNames = offeringDefs.map((d) => d.name);

    let listing;
    try {
      listing = await CardListing.create({
        createdBy: user.id,
        offeringCards: offeringNames,
        offeringCardIds,
        wantedCard: wantedDef.name,
        wantedCardId,
        code: encryptedCode,
        codeHash,
        expiresAt
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        return res.status(409).json({
          code: "ACTIVE_LISTING_EXISTS",
          message: "You already have an active card listing."
        });
      }
      throw err;
    }

    await User.findByIdAndUpdate(user.id, { $set: { hasActiveListing: true } });
    // Bump totalCount on every offered DefinedCard (one listing makes each of
    // its offered cards available to the catalog).
    await DefinedCard.updateMany({ _id: { $in: offeringCardIds } }, { $inc: { totalCount: 1 } });

    res.status(201).json({
      id: listing.id,
      offeringCards: listing.offeringCards,
      wantedCard: listing.wantedCard,
      status: listing.status,
      expiresAt: listing.expiresAt,
      createdAt: listing.createdAt
    });
  } catch (error) {
    next(error);
  }
}

export async function getListings(req: Request, res: Response, next: NextFunction) {
  try {
    const { search, sort, page = "1", limit = "20" } = req.query;
    const query: any = { hidden: false, status: "active" };

    if (search) {
      query.$or = [
        { offeringCards: { $regex: String(search), $options: "i" } },
        { wantedCard: { $regex: String(search), $options: "i" } }
      ];
    }

    const pageNumber = Math.max(Number(page), 1);
    const pageSize = Math.min(Number(limit), 50);

    const sortByTrusted = sort === "trusted";
    const listings = await CardListing.find(query)
      .populate<{ createdBy: any }>("createdBy", "trustScore auth0Id")
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize)
      .lean();

    const allDefinedCards = await DefinedCard.find().lean();
    const cardMap = new Map(allDefinedCards.map((c) => [c.name, c]));

    const payload = listings
      .map((listing: any) => {
        return {
          id: listing._id,
          offeringCards: listing.offeringCards,
          offeringCardImages: (listing.offeringCards || []).map((name: string) => ({
            name,
            imageUrl: cardMap.get(name)?.imageUrl ?? "",
            type: cardMap.get(name)?.type ?? ""
          })),
          wantedCard: listing.wantedCard,
          wantedCardImage: cardMap.get(listing.wantedCard)?.imageUrl ?? "",
          wantedCardType: cardMap.get(listing.wantedCard)?.type ?? "",
          status: listing.status,
          expiresAt: listing.expiresAt,
          createdAt: listing.createdAt,
          claimCount: listing.claimCount,
          reports: listing.reports,
          createdById: listing.createdBy?._id?.toString() ?? null,
          trustScore: listing.createdBy?.trustScore ?? 0,
          maskedCode: maskCode("0000-0000-0000-0000")
        };
      })
      .sort((a, b) => (sortByTrusted ? b.trustScore - a.trustScore : 0));

    const total = await CardListing.countDocuments(query);
    res.json({ data: payload, page: pageNumber, limit: pageSize, total });
  } catch (error) {
    next(error);
  }
}

export async function getMyListings(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    const listings = await CardListing.find({ createdBy: user!.id })
      .sort({ createdAt: -1 })
      .lean();

    const allDefinedCards = await DefinedCard.find().lean();
    const cardMap = new Map(allDefinedCards.map((c) => [c.name, c]));

    const listingIds = listings.map((l) => l._id);
    const claims = await Claim.find({ listingId: { $in: listingIds } })
      .populate("claimedBy", "name email auth0Id")
      .sort({ createdAt: -1 })
      .lean();

    const claimMap = new Map<string, any>();
    for (const c of claims) {
      const lid = c.listingId.toString();
      if (!claimMap.has(lid)) claimMap.set(lid, c);
    }

    const payload = listings.map((listing: any) => {
      const claim = claimMap.get(listing._id.toString());
      const claimer = claim?.claimedBy;

      return {
        id: listing._id,
        offeringCards: listing.offeringCards || [],
        offeringCardImages: (listing.offeringCards || []).map((name: string) => ({
          name,
          imageUrl: cardMap.get(name)?.imageUrl ?? "",
          type: cardMap.get(name)?.type ?? ""
        })),
        wantedCard: listing.wantedCard,
        wantedCardImage: cardMap.get(listing.wantedCard)?.imageUrl ?? "",
        wantedCardType: cardMap.get(listing.wantedCard)?.type ?? "",
        status: listing.status,
        expiresAt: listing.expiresAt,
        createdAt: listing.createdAt,
        claimCount: listing.claimCount,
        tradeOutcome: listing.tradeOutcome ?? null,
        outcomeAt: listing.outcomeAt ?? null,
        disputeReason: listing.disputeReason ?? null,
        claimedBy: claimer ? {
          name: claimer.name || claimer.email?.split("@")[0] || "User",
          email: claimer.email,
        } : null,
        claimedAt: claim?.createdAt ?? listing.claimedAt ?? null,
      };
    });

    res.json({ data: payload });
  } catch (error) {
    next(error);
  }
}

// Owner confirms they received the wanted card in-game from the claimer.
// This is THE point where successfulTrades increments for milestone rewards.
export async function confirmTradeReceived(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const listingId = req.params.id;
    const listing = await CardListing.findOneAndUpdate(
      {
        _id: listingId,
        createdBy: user.id,
        status: "claimed",
        tradeOutcome: "pending"
      },
      { $set: { tradeOutcome: "confirmed", outcomeAt: new Date() } },
      { new: true }
    );
    if (!listing) {
      return res.status(404).json({
        message: "Listing not found, not yours, or no longer awaiting confirmation"
      });
    }

    await User.findByIdAndUpdate(user.id, { $inc: { successfulTrades: 1 } });

    if (listing.claimedBy) {
      User.findById(listing.claimedBy).select("email name").lean().then((claimer: any) => {
        if (claimer?.email) {
          sendTradeConfirmedToClaimer({
            to: claimer.email,
            toName: claimer.name,
            offeringCard: (listing.offeringCards || []).join(", ") || listing.wantedCard
          }).catch(() => { /* silent */ });
        }
      }).catch(() => { /* silent */ });
    }

    res.json({
      id: listing.id,
      tradeOutcome: listing.tradeOutcome,
      outcomeAt: listing.outcomeAt
    });
  } catch (error) {
    next(error);
  }
}

// Owner reports the trade didn't go through. Claimer gets flagged; admin can
// review the flagCount in user management and decide to suspend.
export async function disputeTrade(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const listingId = req.params.id;
    const rawReason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
    const reason = rawReason ? rawReason.slice(0, 400) : undefined;

    const listing = await CardListing.findOneAndUpdate(
      {
        _id: listingId,
        createdBy: user.id,
        status: "claimed",
        tradeOutcome: "pending"
      },
      {
        $set: {
          tradeOutcome: "disputed",
          outcomeAt: new Date(),
          ...(reason ? { disputeReason: reason } : {})
        }
      },
      { new: true }
    );
    if (!listing) {
      return res.status(404).json({
        message: "Listing not found, not yours, or no longer awaiting confirmation"
      });
    }

    let newFlagCount = 0;
    if (listing.claimedBy) {
      const claimer = await User.findByIdAndUpdate(
        listing.claimedBy,
        { $inc: { flagCount: 1 } },
        { new: true, select: "email name flagCount" }
      ).lean<{ email?: string; name?: string; flagCount?: number }>();
      newFlagCount = claimer?.flagCount ?? 0;
      if (claimer?.email) {
        sendTradeDisputedToClaimer({
          to: claimer.email,
          toName: claimer.name,
          offeringCard: (listing.offeringCards || []).join(", ") || listing.wantedCard,
          reason,
          flagCount: newFlagCount
        }).catch(() => { /* silent */ });
      }
    }

    res.json({
      id: listing.id,
      tradeOutcome: listing.tradeOutcome,
      outcomeAt: listing.outcomeAt,
      claimerFlagCount: newFlagCount
    });
  } catch (error) {
    next(error);
  }
}

export async function deleteListing(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    const listingId = req.params.id;

    const listing = await CardListing.findOne({ _id: listingId, createdBy: user!.id });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found or you are not authorized" });
    }

    const wasActive = listing.status === "active";

    if (listing.offeringCardIds && listing.offeringCardIds.length > 0) {
      await DefinedCard.updateMany({ _id: { $in: listing.offeringCardIds } }, { $inc: { totalCount: -1 } });
    }

    await listing.deleteOne();

    if (wasActive) {
      const stillActive = await CardListing.exists({ createdBy: user!.id, status: "active" });
      if (!stillActive) {
        await User.findByIdAndUpdate(user!.id, { $set: { hasActiveListing: false } });
      }
    }

    res.json({ message: "Listing deleted" });
  } catch (error) {
    next(error);
  }
}
