import { Request, Response, NextFunction } from "express";
import { CardListing } from "../models/CardListing";
import { DefinedCard } from "../models/DefinedCard";
import { encryptText, maskCode } from "../utils/encryption";

export async function createListing(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    const { offeringCardId, offeringCount, wantedCardIds, code, expiresInHours } = req.body;

    if (!offeringCardId || !offeringCount || !Array.isArray(wantedCardIds) || wantedCardIds.length === 0 || wantedCardIds.length > 3 || !code) {
      return res.status(400).json({ message: "Invalid listing payload" });
    }

    const offeringDef = await DefinedCard.findById(offeringCardId);
    if (!offeringDef) {
      return res.status(400).json({ message: "Invalid offering card" });
    }

    const expiresAt = new Date(Date.now() + (Number(expiresInHours) || 4) * 60 * 60 * 1000);
    const encryptedCode = encryptText(code);

    const wantedDefs = await DefinedCard.find({ _id: { $in: wantedCardIds } }).lean();
    const wantedNames = wantedDefs.map((d) => d.name);

    const listing = await CardListing.create({
      createdBy: user!.id,
      offeringCard: offeringDef.name,
      offeringCardId: offeringCardId,
      offeringCount: Number(offeringCount),
      wantedCards: wantedNames,
      wantedCardIds: wantedCardIds,
      code: encryptedCode,
      expiresAt
    });

    res.status(201).json({
      id: listing.id,
      offeringCard: listing.offeringCard,
      offeringCount: listing.offeringCount,
      wantedCards: listing.wantedCards,
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
        { offeringCard: { $regex: String(search), $options: "i" } },
        { wantedCards: { $regex: String(search), $options: "i" } }
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

    // Fetch all defined cards to attach image URLs
    const allDefinedCards = await DefinedCard.find().lean();
    const cardMap = new Map(allDefinedCards.map((c) => [c.name, c]));

    const payload = listings
      .map((listing: any) => {
        const offeringDef = cardMap.get(listing.offeringCard);
        return {
          id: listing._id,
          offeringCard: listing.offeringCard,
          offeringCardImage: offeringDef?.imageUrl ?? "",
          offeringCardType: offeringDef?.type ?? "",
          offeringCount: listing.offeringCount ?? 1,
          wantedCards: listing.wantedCards,
          wantedCardImages: listing.wantedCards.map((name: string) => ({
            name,
            imageUrl: cardMap.get(name)?.imageUrl ?? "",
            type: cardMap.get(name)?.type ?? ""
          })),
          status: listing.status,
          expiresAt: listing.expiresAt,
          createdAt: listing.createdAt,
          claimCount: listing.claimCount,
          reports: listing.reports,
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

export async function deleteListing(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    const listingId = req.params.id;

    const listing = await CardListing.findOne({ _id: listingId, createdBy: user!.id });
    if (!listing) {
      return res.status(404).json({ message: "Listing not found or you are not authorized" });
    }

    await listing.deleteOne();
    res.json({ message: "Listing deleted" });
  } catch (error) {
    next(error);
  }
}
