import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";
import { Claim } from "../models/Claim";
import { CardListing } from "../models/CardListing";

export async function getAllUsers(_req: Request, res: Response, next: NextFunction) {
  try {
    const users = await User.find()
      .select("-__v")
      .sort({ createdAt: -1 })
      .lean();

    // Get IP usage per user from claims to detect multi-accounting
    const claims = await Claim.find().select("claimedBy ipAddress").lean();

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

    const payload = users.map((u) => ({
      ...u,
      flagged: flaggedUsers.has(u._id.toString()),
      sharedIps: userSharedIps.get(u._id.toString()) || []
    }));

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
      .lean();

    const claims = await Claim.find({ claimedBy: id })
      .populate("listingId", "offeringCard wantedCards")
      .sort({ createdAt: -1 })
      .lean();

    // Get unique IPs this user has used
    const userIps = [...new Set(claims.map((c) => c.ipAddress))];

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
    }).select("auth0Id email role status").lean();

    res.json({
      user,
      listings,
      claims,
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
