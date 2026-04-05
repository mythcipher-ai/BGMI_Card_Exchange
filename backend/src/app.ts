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
import { ipRateLimiter } from "./middleware/rateLimit";
import { DefinedCard } from "./models/DefinedCard";
import { CardListing } from "./models/CardListing";
import { maskCode } from "./utils/encryption";

export const app = express();

app.use(helmet());
app.use(cors());
app.use(json());
app.use(ipRateLimiter);

// Public routes (no auth required)
app.get("/api/public/cards", async (_req, res, next) => {
  try {
    const cards = await DefinedCard.find().sort({ type: 1, name: 1 }).lean();
    res.json({ data: cards });
  } catch (error) { next(error); }
});

app.get("/api/public/cards/types", async (_req, res, next) => {
  try {
    const types = await DefinedCard.distinct("type");
    res.json({ data: types });
  } catch (error) { next(error); }
});

app.get("/api/public/listings", async (req, res, next) => {
  try {
    const { search, sort, page = "1", limit = "20" } = req.query;
    const q: any = { hidden: false, status: "active" };
    if (search) {
      q.$or = [
        { offeringCard: { $regex: String(search), $options: "i" } },
        { wantedCards: { $regex: String(search), $options: "i" } }
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
      const od = m.get(l.offeringCard);
      return {
        id: l._id, offeringCard: l.offeringCard,
        offeringCardImage: od?.imageUrl ?? "", offeringCardType: od?.type ?? "",
        offeringCount: l.offeringCount ?? 1, wantedCards: l.wantedCards,
        wantedCardImages: l.wantedCards.map((n: string) => ({
          name: n, imageUrl: m.get(n)?.imageUrl ?? "", type: m.get(n)?.type ?? ""
        })),
        status: l.status, expiresAt: l.expiresAt, createdAt: l.createdAt,
        claimCount: l.claimCount, trustScore: l.createdBy?.trustScore ?? 0,
        maskedCode: maskCode("0000-0000-0000-0000")
      };
    }).sort((a, b) => byTrust ? b.trustScore - a.trustScore : 0);
    const total = await CardListing.countDocuments(q);
    res.json({ data, page: pg, limit: sz, total });
  } catch (error) { next(error); }
});

// Authenticated routes
app.use("/api", authMiddleware, attachCurrentUser);
app.use("/api/me", authRouter);
app.use("/api/listings", listingsRouter);
app.use("/api/claims", claimsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/admin", adminRouter);

app.use(errorHandler);
