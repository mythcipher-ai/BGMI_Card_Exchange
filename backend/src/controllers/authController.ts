import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { computeEffectiveTrades } from "../utils/milestones";

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Missing authenticated user" });
    }

    // Compute milestone-eligible trade count live. The stored
    // user.successfulTrades counter only reflects the listing-leg, but the
    // milestone counts only completed pairs (listing-confirmed AND claim-
    // confirmed). See utils/milestones.ts.
    const { effective, listedConfirmed, claimedConfirmed } = await computeEffectiveTrades(user.id);

    res.json({
      id: user.id,
      role: user.role,
      status: user.status,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      trustScore: user.trustScore,
      totalClaims: user.totalClaims,
      successfulClaims: user.successfulClaims,
      successfulTrades: effective,
      listedConfirmed,
      claimedConfirmed,
      reportsCount: user.reportsCount,
      dailyClaims: user.dailyClaims,
      instagramHandle: user.instagramHandle,
      bgmiUid: user.bgmiUid,
      hasActiveListing: user.hasActiveListing ?? false,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
}

export async function syncProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Missing authenticated user" });
    }

    const { name, email, picture } = req.body;
    const update: Record<string, string> = {};
    if (name && typeof name === "string") update.name = name;
    if (picture && typeof picture === "string") update.picture = picture;
    // Email is the linchpin for every outbound notification — claim alerts,
    // trade outcome emails, gift requests. Persist whatever the IdP gives us.
    if (email && typeof email === "string") {
      const clean = email.trim().toLowerCase();
      if (clean) update.email = clean;
    }

    if (Object.keys(update).length > 0) {
      await User.findByIdAndUpdate(user.id, update);
      console.log("[auth] syncProfile", { userId: user.id, fields: Object.keys(update) });
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
