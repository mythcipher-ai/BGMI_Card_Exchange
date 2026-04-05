import { Request, Response, NextFunction } from "express";
import { Report } from "../models/Report";
import { CardListing } from "../models/CardListing";
import { User } from "../models/User";
import { config } from "../config";

export async function createReport(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    const listingId = req.params.listingId;
    const reason = String(req.body.reason || "").trim();

    if (!user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const existingReport = await Report.findOne({ listingId, reportedBy: user.id });
    if (existingReport) {
      return res.status(400).json({ message: "You already reported this listing" });
    }

    const listing = await CardListing.findById(listingId);
    if (!listing || listing.hidden || listing.status !== "active") {
      return res.status(404).json({ message: "Listing not available for reporting" });
    }

    await Report.create({
      listingId,
      reportedBy: user.id,
      reason,
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"] as string
    });

    listing.reports += 1;
    if (listing.reports >= config.reportThreshold) {
      listing.hidden = true;
      const owner = await User.findById(listing.createdBy);
      if (owner) {
        owner.trustScore = Math.max(0, owner.trustScore - 1);
        owner.reportsCount += 1;
        await owner.save();
      }
    }

    await listing.save();

    res.status(201).json({
      message: listing.hidden ? "Listing hidden after reports" : "Report submitted successfully",
      reports: listing.reports
    });
  } catch (error) {
    next(error);
  }
}
