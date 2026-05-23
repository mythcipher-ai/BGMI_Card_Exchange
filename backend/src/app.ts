import cors from "cors";
import express from "express";
import helmet from "helmet";
import { json } from "express";
import { authMiddleware, attachCurrentUser } from "./middleware/auth";
import { errorHandler } from "./middleware/errorHandler";
import { listingsRouter } from "./routes/listings";
import { claimsRouter } from "./routes/claims";
import { reportsRouter } from "./routes/reports";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { giftsRouter } from "./routes/gifts";
import { rewardsRouter } from "./routes/rewards";
import { ipRateLimiter } from "./middleware/rateLimit";
import { DefinedCard } from "./models/DefinedCard";
import { CardListing } from "./models/CardListing";
import { Claim } from "./models/Claim";
import { User } from "./models/User";
import { Event } from "./models/Event";
import { maskCode } from "./utils/encryption";
import { expireListings } from "./controllers/maintenanceController";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(json());

// Mounted BEFORE the global IP rate limiter so it remains fully unprotected
// (no auth, no rate limit). Per spec: safe to hit from any cron / monitor.
// Idempotent — see expireListings docs.
app.get("/api/public/expire-listings", expireListings);

app.use(ipRateLimiter);

// ---- Public routes (no auth) ----
// Only return cards whose event is ACTIVE. Draft events stay hidden from
// regular users so they can't list a card from an unfinished event.
app.get("/api/public/cards", async (_req, res, next) => {
  try {
    const activeEventIds = await Event.find({ status: "active" }).distinct("_id");
    const cards = await DefinedCard.find({ eventId: { $in: activeEventIds } })
      .sort({ type: 1, name: 1 })
      .lean();
    res.json({ data: cards });
  } catch (error) { next(error); }
});

// List active events (used by the user-facing AddCard browse flow).
app.get("/api/public/events", async (_req, res, next) => {
  try {
    const events = await Event.find({ status: "active" })
      .select("_id name imageUrl status createdAt")
      .sort({ createdAt: -1 })
      .lean();
    res.json({ data: events });
  } catch (error) { next(error); }
});

app.get("/api/public/cards/types", async (_req, res, next) => {
  try {
    const activeEventIds = await Event.find({ status: "active" }).distinct("_id");
    const types = await DefinedCard.distinct("type", { eventId: { $in: activeEventIds } });
    res.json({ data: types });
  } catch (error) { next(error); }
});

// Catalog: every card from an active event, paired with how many active listings
// (codes) currently exist for it. The home page renders this so cards stay
// visible even when nobody has listed one yet — they just show "no codes yet".
app.get("/api/public/catalog", async (_req, res, next) => {
  try {
    const activeEvents = await Event.find({ status: "active" }).select("_id name").lean();
    const eventIds = activeEvents.map((e) => e._id);
    const eventNameById = new Map(activeEvents.map((e) => [e._id.toString(), e.name]));

    const cards = await DefinedCard.find({ eventId: { $in: eventIds } })
      .sort({ type: 1, name: 1 })
      .lean();

    // Tally active listings per card name. offeringCards is an array (1-3
    // values) — we $unwind it so a listing that offers [A, B, C] counts once
    // toward each of A, B, C in the catalog grid.
    const tallies = await CardListing.aggregate([
      { $match: { status: "active", hidden: false } },
      { $unwind: "$offeringCards" },
      { $match: { offeringCards: { $in: cards.map((c) => c.name) } } },
      { $group: { _id: "$offeringCards", count: { $sum: 1 } } }
    ]);
    const countByName = new Map<string, number>(tallies.map((t: any) => [t._id, t.count]));

    const data = cards.map((c: any) => ({
      id: c._id,
      name: c.name,
      type: c.type,
      imageUrl: c.imageUrl,
      eventId: c.eventId,
      eventName: eventNameById.get(c.eventId?.toString()) ?? "",
      availableCount: countByName.get(c.name) ?? 0
    }));

    res.json({ data });
  } catch (error) { next(error); }
});

app.get("/api/public/listings", async (req, res, next) => {
  try {
    const { search, sort, page = "1", limit = "20", cardId, cardName } = req.query;
    const q: any = { hidden: false, status: "active" };
    // Filter to listings that OFFER a particular card. With the array model
    // we match any listing whose offeringCards / offeringCardIds includes it.
    if (cardId) {
      q.offeringCardIds = cardId;
    } else if (cardName) {
      q.offeringCards = String(cardName);
    }
    if (search) {
      q.$or = [
        { offeringCards: { $regex: String(search), $options: "i" } },
        { wantedCard: { $regex: String(search), $options: "i" } }
      ];
    }
    const pg = Math.max(Number(page), 1);
    const sz = Math.min(Number(limit), 50);
    const byTrust = sort === "trusted";
    const listings = await CardListing.find(q)
      .populate("createdBy", "trustScore")
      .sort({ createdAt: -1 }).skip((pg - 1) * sz).limit(sz).lean();
    const defs = await DefinedCard.find().lean();
    const m = new Map(defs.map((c) => [c.name, c]));
    const data = listings.map((l: any) => {
      const offeringCards: string[] = l.offeringCards || [];
      const wanted = m.get(l.wantedCard);
      return {
        id: l._id,
        offeringCards,
        offeringCardImages: offeringCards.map((name) => ({
          name,
          imageUrl: m.get(name)?.imageUrl ?? "",
          type: m.get(name)?.type ?? ""
        })),
        wantedCard: l.wantedCard,
        wantedCardImage: wanted?.imageUrl ?? "",
        wantedCardType: wanted?.type ?? "",
        status: l.status,
        expiresAt: l.expiresAt,
        createdAt: l.createdAt,
        claimCount: l.claimCount,
        // Surfaced so the frontend can hide the Claim button on the user's
        // own listing. Backend already rejects self-claims defensively.
        createdById: l.createdBy?._id?.toString() ?? null,
        trustScore: l.createdBy?.trustScore ?? 0,
        maskedCode: maskCode("0000-0000-0000-0000")
      };
    }).sort((a, b) => byTrust ? b.trustScore - a.trustScore : 0);
    const total = await CardListing.countDocuments(q);
    res.json({ data, page: pg, limit: sz, total });
  } catch (error) { next(error); }
});

app.get("/api/public/stats", async (_req, res, next) => {
  try {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);
    const [activeListings, listingsToday, totalTrades, activeTraders] = await Promise.all([
      CardListing.countDocuments({ status: "active", hidden: false }),
      CardListing.countDocuments({ createdAt: { $gte: startOfToday } }),
      Claim.countDocuments({}),
      User.countDocuments({ status: "active", hasActiveListing: true })
    ]);
    res.json({ data: { activeTraders, activeListings, totalTrades, listingsToday } });
  } catch (error) { next(error); }
});

// ---- Authenticated routes ----
app.use("/api", authMiddleware, attachCurrentUser);
app.use("/api/me", authRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/claims", claimsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/gifts", giftsRouter);
app.use("/api/rewards", rewardsRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);
