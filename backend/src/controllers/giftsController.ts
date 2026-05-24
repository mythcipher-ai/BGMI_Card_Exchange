import { Request, Response, NextFunction } from "express";
import { GiftRequest, GiftRequestStatus } from "../models/GiftRequest";
import { CardListing } from "../models/CardListing";
import { User } from "../models/User";
import { DefinedCard } from "../models/DefinedCard";
import { sendGiftRequestEmail } from "../utils/email";

const NAME_MAX = 60;
const MESSAGE_MIN = 10;
const MESSAGE_MAX = 500;
const POPULARITY_MAX = 1000;

function serialize(g: any, listingCard?: string, listingCardImage?: string, fromUserName?: string, toUserName?: string) {
  return {
    id: g._id,
    listingId: g.listingId,
    listingCard: listingCard ?? "",
    listingCardImage: listingCardImage ?? "",
    fromUserName: fromUserName ?? "",
    toUserName: toUserName ?? "",
    requesterName: g.requesterName,
    requesterEmail: g.requesterEmail,
    message: g.message,
    popularityOffered: g.popularityOffered,
    status: g.status,
    emailSent: g.emailSent,
    createdAt: g.createdAt,
    expiresAt: g.expiresAt
  };
}

export async function createGiftRequest(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const listingId = req.params.listingId;
    const { requesterName, message, popularityOffered } = req.body ?? {};

    // ---- Validate payload ----
    if (typeof requesterName !== "string" || !requesterName.trim() || requesterName.trim().length > NAME_MAX) {
      return res.status(400).json({ message: "Invalid requester name" });
    }
    if (typeof message !== "string" || message.trim().length < MESSAGE_MIN || message.trim().length > MESSAGE_MAX) {
      return res.status(400).json({ message: `Message must be ${MESSAGE_MIN}-${MESSAGE_MAX} characters` });
    }

    // Requester email is no longer collected from the client — we use the
    // authenticated user's email automatically. If they signed in via a
    // provider that doesn't expose an email, we still store a placeholder so
    // the listing owner sees who reached out (they can reply via the platform).
    const requesterEmail = (user.email || "").trim().toLowerCase();
    // Popularity is BGMI in-game (the requester promises it off-platform to the owner).
    // We don't track or verify it — we just carry the number in the email.
    const offered = Math.floor(Number(popularityOffered) || 0);
    if (offered < 0 || offered > POPULARITY_MAX) {
      return res.status(400).json({ message: "Invalid popularity offered" });
    }

    // ---- Load listing + owner ----
    const listing = await CardListing.findOne({ _id: listingId, status: "active", hidden: false });
    if (!listing) {
      return res.status(404).json({ message: "Listing is no longer available" });
    }
    if (listing.createdBy.toString() === user.id.toString()) {
      return res.status(400).json({ message: "You cannot request a gift on your own listing" });
    }

    const owner = await User.findById(listing.createdBy);
    if (!owner) {
      return res.status(404).json({ message: "Listing owner not found" });
    }

    // ---- Insert (the partial unique index enforces 1-open-per-listing-per-user) ----
    let gift;
    try {
      gift = await GiftRequest.create({
        listingId: listing._id,
        fromUser: user.id,
        toUser: owner._id,
        requesterName: requesterName.trim(),
        requesterEmail,
        message: message.trim(),
        popularityOffered: offered,
        ipAddress: req.ip,
        userAgent: req.headers["user-agent"] as string
      });
    } catch (err: any) {
      if (err?.code === 11000) {
        return res.status(409).json({
          code: "REQUEST_ALREADY_OPEN",
          message: "You already have an open gift request for this listing."
        });
      }
      throw err;
    }

    // ---- Respond immediately, send email asynchronously ----
    const offeringLabel = (listing.offeringCards || []).join(", ") || listing.wantedCard;
    res.status(201).json({
      data: serialize(gift, offeringLabel, "", user.name || "", owner.name || "")
    });

    // Fire-and-forget email send.
    void (async () => {
      if (!owner.email) return;
      if (owner.notifications && owner.notifications.giftRequests === false) return;

      const result = await sendGiftRequestEmail({
        to: owner.email,
        toName: owner.name,
        cardName: offeringLabel,
        requesterName: requesterName.trim(),
        requesterEmail,
        message: message.trim(),
        popularityOffered: offered
      });
      await GiftRequest.findByIdAndUpdate(gift._id, {
        $set: {
          emailSent: result.ok,
          ...(result.error ? { emailError: result.error } : {})
        }
      });
    })();
  } catch (error) {
    next(error);
  }
}

export async function getIncomingGiftRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const gifts = await GiftRequest.find({ toUser: user.id })
      .sort({ createdAt: -1 })
      .populate<{ listingId: any }>("listingId", "offeringCards offeringCardIds")
      .populate<{ fromUser: any }>("fromUser", "name email")
      .lean();

    const allCardNames: string[] = gifts.flatMap((g: any) => g.listingId?.offeringCards || []);
    const defs = await DefinedCard.find({ name: { $in: allCardNames } }).lean();
    const imageMap = new Map(defs.map((d) => [d.name, d.imageUrl]));

    const data = gifts.map((g: any) => {
      const names: string[] = g.listingId?.offeringCards || [];
      const primary = names[0] || "";
      return serialize(
        g,
        names.join(", "),
        primary ? (imageMap.get(primary) ?? "") : "",
        g.fromUser?.name || "",
        user.name || ""
      );
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

export async function getOutgoingGiftRequests(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const gifts = await GiftRequest.find({ fromUser: user.id })
      .sort({ createdAt: -1 })
      .populate<{ listingId: any }>("listingId", "offeringCards")
      .populate<{ toUser: any }>("toUser", "name")
      .lean();

    const allCardNames: string[] = gifts.flatMap((g: any) => g.listingId?.offeringCards || []);
    const defs = await DefinedCard.find({ name: { $in: allCardNames } }).lean();
    const imageMap = new Map(defs.map((d) => [d.name, d.imageUrl]));

    const data = gifts.map((g: any) => {
      const names: string[] = g.listingId?.offeringCards || [];
      const primary = names[0] || "";
      return serialize(
        g,
        names.join(", "),
        primary ? (imageMap.get(primary) ?? "") : "",
        user.name || "",
        g.toUser?.name || ""
      );
    });
    res.json({ data });
  } catch (error) {
    next(error);
  }
}

const VALID_TRANSITIONS: Record<GiftRequestStatus, GiftRequestStatus[]> = {
  pending: ["acknowledged", "declined", "fulfilled"],
  acknowledged: ["fulfilled", "declined"],
  fulfilled: [],
  declined: [],
  expired: []
};

export async function updateGiftRequestStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user!;
    const { id } = req.params;
    const { status } = req.body ?? {};

    if (!["acknowledged", "fulfilled", "declined"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const gift = await GiftRequest.findById(id);
    if (!gift) {
      return res.status(404).json({ message: "Gift request not found" });
    }
    // Only the recipient (the listing owner) can change status.
    if (gift.toUser.toString() !== user.id.toString()) {
      return res.status(403).json({ message: "You can only update gift requests sent to you" });
    }

    const allowed = VALID_TRANSITIONS[gift.status];
    if (!allowed.includes(status as GiftRequestStatus)) {
      return res.status(400).json({ message: `Cannot transition from ${gift.status} to ${status}` });
    }

    gift.status = status as GiftRequestStatus;
    await gift.save();

    res.json({ data: serialize(gift) });
  } catch (error) {
    next(error);
  }
}
