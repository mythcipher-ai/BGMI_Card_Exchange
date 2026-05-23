import { Request, Response, NextFunction } from "express";
import { CardListing } from "../models/CardListing";
import { Claim } from "../models/Claim";
import { User } from "../models/User";

export async function getPlatformStats(_req: Request, res: Response, next: NextFunction) {
  try {
    const startOfToday = new Date();
    startOfToday.setUTCHours(0, 0, 0, 0);

    const [activeListings, listingsToday, totalTrades, activeTraders] = await Promise.all([
      CardListing.countDocuments({ status: "active", hidden: false }),
      CardListing.countDocuments({ createdAt: { $gte: startOfToday } }),
      Claim.countDocuments({}),
      User.countDocuments({ status: "active", hasActiveListing: true })
    ]);

    res.json({
      data: {
        activeTraders,
        activeListings,
        totalTrades,
        listingsToday
      }
    });
  } catch (error) {
    next(error);
  }
}
