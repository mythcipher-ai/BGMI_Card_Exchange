import { Request, Response, NextFunction } from "express";
import { RewardRequest, RewardStatus } from "../models/RewardRequest";
import { User } from "../models/User";
import { MILESTONES, findMilestone, computeEffectiveTrades } from "../utils/milestones";
import {
  sendRewardClaimToAdmin,
  sendRewardDeliveredToUser,
  sendRewardRejectedToUser
} from "../utils/email";

// =====================================================================
// USER-FACING
// =====================================================================

/**
 * Returns the milestone table along with the caller's current trade count
 * and the per-milestone status (locked / available / claimed-pending /
 * claimed-approved / claimed-delivered / claimed-rejected).
 *
 * Frontend renders the /rewards grid directly off this response.
 */
export async function getMyMilestones(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const myRequests = await RewardRequest.find({ userId: user.id }).lean();
    const requestByMilestone = new Map<number, any>();
    for (const r of myRequests) requestByMilestone.set(r.milestone, r);

    // Effective trades = min(confirmed-listings, confirmed-claims). The user
    // must complete BOTH legs of the marketplace for the milestone to count.
    const { effective: trades } = await computeEffectiveTrades(user.id);

    const milestones = MILESTONES.map((m) => {
      const request = requestByMilestone.get(m.threshold);
      let state: "locked" | "available" | "pending" | "approved" | "delivered" | "rejected";
      if (request) {
        if (request.status === "rejected") state = "rejected";
        else if (request.status === "delivered") state = "delivered";
        else if (request.status === "approved") state = "approved";
        else state = "pending";
      } else if (trades >= m.threshold) {
        state = "available";
      } else {
        state = "locked";
      }
      return {
        threshold: m.threshold,
        popularityReward: m.popularityReward,
        state,
        request: request ? {
          id: request._id,
          status: request.status,
          bgmiUid: request.bgmiUid,
          rejectionReason: request.rejectionReason,
          createdAt: request.createdAt,
          deliveredAt: request.deliveredAt
        } : null
      };
    });

    res.json({
      data: {
        successfulTrades: trades,
        savedBgmiUid: user.bgmiUid ?? null,
        milestones
      }
    });
  } catch (error) {
    next(error);
  }
}

const UID_RE = /^\d{11}$/;

/**
 * User submits a milestone claim. Server validates EVERY rule from scratch —
 * never trusts the frontend's belief about trade count or milestone state.
 *
 * Rules:
 *   - milestone must be a real one
 *   - user.successfulTrades must >= threshold (live, not stored snapshot)
 *   - no existing request for (user, milestone) — partial unique index also
 *     enforces this at the DB layer
 *   - bgmiUid must be exactly 11 digits
 */
export async function claimMilestone(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { milestone, bgmiUid } = req.body ?? {};

    if (typeof milestone !== "number" || !Number.isInteger(milestone)) {
      return res.status(400).json({ message: "Milestone must be an integer" });
    }
    const def = findMilestone(milestone);
    if (!def) {
      return res.status(400).json({ message: "Unknown milestone" });
    }

    if (typeof bgmiUid !== "string" || !UID_RE.test(bgmiUid.trim())) {
      return res.status(400).json({
        code: "INVALID_UID",
        message: "BGMI UID must be exactly 11 digits"
      });
    }
    const cleanUid = bgmiUid.trim();

    // Live count, not the frontend's claim. Never trust the client.
    const liveUser = await User.findById(user.id);
    if (!liveUser) return res.status(401).json({ message: "User not found" });

    const { effective: liveTrades } = await computeEffectiveTrades(liveUser.id);
    if (liveTrades < def.threshold) {
      return res.status(403).json({
        code: "MILESTONE_LOCKED",
        message: `You need ${def.threshold} successful trade(s) to claim this reward.`
      });
    }

    const existing = await RewardRequest.findOne({ userId: user.id, milestone: def.threshold });
    if (existing) {
      return res.status(409).json({
        code: "ALREADY_CLAIMED",
        message: "You have already claimed this milestone."
      });
    }

    let request;
    try {
      request = await RewardRequest.create({
        userId: user.id,
        milestone: def.threshold,
        popularityAmount: def.popularityReward,
        bgmiUid: cleanUid,
        successfulTradesAtClaim: liveTrades
      });
    } catch (err: any) {
      // Race: another request inserted between the check and the write.
      if (err?.code === 11000) {
        return res.status(409).json({
          code: "ALREADY_CLAIMED",
          message: "You have already claimed this milestone."
        });
      }
      throw err;
    }

    // Remember the UID for future auto-fill.
    liveUser.bgmiUid = cleanUid;
    await liveUser.save();

    res.status(201).json({
      data: {
        id: request._id,
        milestone: request.milestone,
        popularityAmount: request.popularityAmount,
        status: request.status,
        bgmiUid: request.bgmiUid,
        createdAt: request.createdAt
      }
    });

    // Fire-and-forget admin notification email.
    void sendRewardClaimToAdmin({
      userName: liveUser.name,
      userEmail: liveUser.email,
      milestone: request.milestone,
      popularityAmount: request.popularityAmount,
      bgmiUid: cleanUid,
      successfulTrades: liveTrades,
      submittedAt: request.createdAt
    }).catch(() => { /* swallow, admin can also see this in the panel */ });
  } catch (error) {
    next(error);
  }
}

// =====================================================================
// ADMIN-FACING
// =====================================================================

export async function adminListRewardRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const { status } = req.query;
    const q: any = {};
    if (status && ["pending", "approved", "delivered", "rejected"].includes(String(status))) {
      q.status = status;
    }
    const requests = await RewardRequest.find(q)
      .sort({ createdAt: -1 })
      .populate<{ userId: any }>("userId", "name email auth0Id successfulTrades bgmiUid")
      .lean();

    const data = requests.map((r: any) => ({
      id: r._id,
      milestone: r.milestone,
      popularityAmount: r.popularityAmount,
      bgmiUid: r.bgmiUid,
      status: r.status,
      successfulTradesAtClaim: r.successfulTradesAtClaim,
      currentTrades: r.userId?.successfulTrades ?? 0,
      user: r.userId ? {
        id: r.userId._id,
        name: r.userId.name,
        email: r.userId.email
      } : null,
      rejectionReason: r.rejectionReason,
      createdAt: r.createdAt,
      approvedAt: r.approvedAt,
      deliveredAt: r.deliveredAt,
      rejectedAt: r.rejectedAt
    }));
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

// "delivered" is no longer reachable per product decision — admin only marks
// pending requests as approved or rejected. The enum stays in the model so
// historical rows render correctly.
const VALID_TRANSITIONS: Record<RewardStatus, RewardStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["rejected"],
  delivered: [],
  rejected: []
};

export async function adminSetRewardStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const admin = req.user!;
    const { id } = req.params;
    const { status, rejectionReason } = req.body ?? {};

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved | rejected" });
    }

    const request = await RewardRequest.findById(id).populate<{ userId: any }>("userId", "email name");
    if (!request) return res.status(404).json({ message: "Reward request not found" });

    if (!VALID_TRANSITIONS[request.status].includes(status as RewardStatus)) {
      return res.status(400).json({
        message: `Cannot transition from ${request.status} to ${status}`
      });
    }

    const now = new Date();
    request.status = status;
    if (status === "approved") {
      request.approvedBy = admin._id as any;
      request.approvedAt = now;
    } else if (status === "rejected") {
      request.rejectedAt = now;
      if (typeof rejectionReason === "string") {
        request.rejectionReason = rejectionReason.trim().slice(0, 500);
      }
    }
    await request.save();

    res.json({ data: { id: request._id, status: request.status } });

    // Approval emails reuse the delivered template since the reward is
    // effectively granted at the approve step now.
    const targetUser = request.userId as any;
    if (targetUser?.email) {
      if (status === "approved") {
        void sendRewardDeliveredToUser({
          to: targetUser.email,
          toName: targetUser.name,
          milestone: request.milestone,
          popularityAmount: request.popularityAmount,
          bgmiUid: request.bgmiUid
        }).catch(() => {});
      } else if (status === "rejected") {
        void sendRewardRejectedToUser({
          to: targetUser.email,
          toName: targetUser.name,
          milestone: request.milestone,
          popularityAmount: request.popularityAmount,
          rejectionReason: request.rejectionReason
        }).catch(() => {});
      }
    }
  } catch (error) {
    next(error);
  }
}
