import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { Claim } from "../models/Claim";
import { CardListing } from "../models/CardListing";
import { DefinedCard } from "../models/DefinedCard";
import { computeEffectiveTrades } from "../utils/milestones";

export async function getAllUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await User.find({ role: { $ne: "admin" } })
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    // Get IP usage per user from claims to detect multi-accounting
    const claims = await Claim.find().select("claimedBy ipAddress listingId").lean();

    // Build IP -> users map
    const ipToUsers = new Map<string, Set<string>>();
    for (const claim of claims) {
      const userId = claim.claimedBy.toString();
      const ip = claim.ipAddress;
      if (!ipToUsers.has(ip)) ipToUsers.set(ip, new Set());
      ipToUsers.get(ip)!.add(userId);
    }

    // Find flagged IPs (same IP used by multiple users)
    const flaggedUsers = new Set<string>();
    const userSharedIps = new Map<string, string[]>();
    for (const [ip, userIds] of ipToUsers.entries()) {
      if (userIds.size > 1) {
        for (const uid of userIds) {
          flaggedUsers.add(uid);
          if (!userSharedIps.has(uid)) userSharedIps.set(uid, []);
          userSharedIps.get(uid)!.push(ip);
        }
      }
    }

    // Count listings and claimed listings per user
    const allListings = await CardListing.find().select("createdBy status").lean();
    const listingsCount = new Map<string, number>();
    const claimedCount = new Map<string, number>();
    for (const l of allListings) {
      const uid = l.createdBy.toString();
      listingsCount.set(uid, (listingsCount.get(uid) || 0) + 1);
      if (l.status === "claimed") {
        claimedCount.set(uid, (claimedCount.get(uid) || 0) + 1);
      }
    }

    const payload = users.map((u: any) => {
      const uid = u._id.toString();
      return {
        ...u,
        listingsCount: listingsCount.get(uid) || 0,
        claimedCount: claimedCount.get(uid) || 0,
        // IP-collision flag (legacy shared-IP detection)
        flagged: flaggedUsers.has(uid),
        sharedIps: userSharedIps.get(uid) || [],
        // Trade-dispute flag count: number of times a lister marked a trade by
        // this user as "not received". Used by admin for suspension decisions.
        flagCount: u.flagCount ?? 0,
        successfulTrades: u.successfulTrades ?? 0
      };
    });

    res.json({ data: payload });
  } catch (error) {
    next(error);
  }
}

export async function getUserDetail(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await User.findById(id).lean();
    if (!user) return res.status(404).json({ message: "User not found" });

    const listings = await CardListing.find({ createdBy: id })
      .sort({ createdAt: -1 })
      .populate<{ claimedBy: any }>("claimedBy", "name email")
      .lean();

    const claims = await Claim.find({ claimedBy: id })
      .populate<{ listingId: any }>({
        path: "listingId",
        populate: { path: "createdBy", select: "name email" }
      })
      .sort({ createdAt: -1 })
      .lean();

    // Pull image metadata for every card referenced by either side so the
    // detail page can show real thumbnails instead of just names.
    const cardNames = new Set<string>();
    for (const l of listings as any[]) {
      for (const n of l.offeringCards || []) cardNames.add(n);
      if (l.wantedCard) cardNames.add(l.wantedCard);
    }
    for (const c of claims as any[]) {
      for (const n of (c.listingId?.offeringCards as string[] | undefined) || []) cardNames.add(n);
      if (c.listingId?.wantedCard) cardNames.add(c.listingId.wantedCard);
    }
    const defs = await DefinedCard.find({ name: { $in: [...cardNames] } }).lean();
    const cardMap = new Map(defs.map((d) => [d.name, d]));

    const enrichListing = (l: any) => ({
      _id: l._id,
      status: l.status,
      offeringCards: l.offeringCards || [],
      offeringCardImages: (l.offeringCards || []).map((name: string) => ({
        name,
        imageUrl: cardMap.get(name)?.imageUrl ?? "",
        type: cardMap.get(name)?.type ?? ""
      })),
      wantedCard: l.wantedCard,
      wantedCardImage: cardMap.get(l.wantedCard)?.imageUrl ?? "",
      wantedCardType: cardMap.get(l.wantedCard)?.type ?? "",
      tradeOutcome: l.tradeOutcome ?? null,
      outcomeAt: l.outcomeAt ?? null,
      disputeReason: l.disputeReason ?? null,
      claimCount: l.claimCount ?? 0,
      claimedBy: l.claimedBy ? {
        name: l.claimedBy.name || l.claimedBy.email?.split("@")[0] || "User",
        email: l.claimedBy.email
      } : null,
      claimedAt: l.claimedAt ?? null,
      createdAt: l.createdAt,
      expiresAt: l.expiresAt,
      closedExternallyAt: l.closedExternallyAt ?? null
    });

    const enrichClaim = (c: any) => {
      const l = c.listingId;
      return {
        _id: c._id,
        revealedCode: c.revealedCode,
        ipAddress: c.ipAddress,
        createdAt: c.createdAt,
        listing: l ? {
          _id: l._id,
          offeringCards: l.offeringCards || [],
          offeringCardImages: (l.offeringCards || []).map((name: string) => ({
            name,
            imageUrl: cardMap.get(name)?.imageUrl ?? "",
            type: cardMap.get(name)?.type ?? ""
          })),
          wantedCard: l.wantedCard,
          wantedCardImage: cardMap.get(l.wantedCard)?.imageUrl ?? "",
          tradeOutcome: l.tradeOutcome ?? null,
          outcomeAt: l.outcomeAt ?? null,
          owner: l.createdBy ? {
            name: l.createdBy.name || l.createdBy.email?.split("@")[0] || "User",
            email: l.createdBy.email
          } : null
        } : null
      };
    };

    const enrichedListings = (listings as any[]).map(enrichListing);
    const enrichedClaims = (claims as any[]).map(enrichClaim);

    // Per-outcome breakdown drives the "feedback received" summary in the UI.
    const feedback = {
      pending: enrichedListings.filter((l) => l.status === "claimed" && l.tradeOutcome === "pending").length,
      confirmed: enrichedListings.filter((l) => l.tradeOutcome === "confirmed").length,
      disputed: enrichedListings.filter((l) => l.tradeOutcome === "disputed").length,
      external: enrichedListings.filter((l) => l.status === "external").length
    };

    const { effective: effectiveTrades, listedConfirmed, claimedConfirmed } =
      await computeEffectiveTrades(String(user._id));

    // Get unique IPs this user has used
    const userIps = [...new Set((claims as any[]).map((c) => c.ipAddress))].filter(Boolean);

    // Find other users sharing same IPs
    const otherClaims = await Claim.find({
      ipAddress: { $in: userIps },
      claimedBy: { $ne: id }
    }).select("claimedBy ipAddress").lean();

    const sharedWith = new Map<string, string[]>();
    for (const c of otherClaims) {
      const uid = c.claimedBy.toString();
      if (!sharedWith.has(uid)) sharedWith.set(uid, []);
      if (!sharedWith.get(uid)!.includes(c.ipAddress)) {
        sharedWith.get(uid)!.push(c.ipAddress);
      }
    }

    const sharedIpUsers = await User.find({
      _id: { $in: [...sharedWith.keys()] }
    }).select("auth0Id email name picture role status").lean();

    res.json({
      user,
      listings: enrichedListings,
      claims: enrichedClaims,
      feedback,
      effectiveTrades,
      listedConfirmed,
      claimedConfirmed,
      ips: userIps,
      sharedIpUsers: sharedIpUsers.map((u) => ({
        ...u,
        sharedIps: sharedWith.get(u._id.toString()) || []
      }))
    });
  } catch (error) {
    next(error);
  }
}

export async function blockUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { status: "blocked" }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User blocked", user });
  } catch (error) {
    next(error);
  }
}

export async function unblockUser(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { status: "active" }, { new: true });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ message: "User unblocked", user });
  } catch (error) {
    next(error);
  }
}

// Admin sets a user to "user" or "manager".
// Cannot promote to "admin" through the API; admin role is reserved for
// out-of-band assignment by a maintainer.
export async function setUserRole(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { role } = req.body ?? {};

    if (role !== "user" && role !== "manager") {
      return res.status(400).json({ message: "Role must be 'user' or 'manager'" });
    }

    const target = await User.findById(id);
    if (!target) return res.status(404).json({ message: "User not found" });
    if (target.role === "admin") {
      return res.status(403).json({ message: "Admin role cannot be modified through this endpoint" });
    }

    target.role = role;
    await target.save();
    res.json({ message: "Role updated", user: target });
  } catch (error) {
    next(error);
  }
}
