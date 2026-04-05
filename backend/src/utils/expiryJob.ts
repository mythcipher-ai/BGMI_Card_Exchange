import { CardListing } from "../models/CardListing";

const CLEANUP_INTERVAL_MS = 10 * 60 * 1000;

export function startExpiryJob() {
  setInterval(async () => {
    try {
      const now = new Date();
      const result = await CardListing.updateMany(
        { status: "active", expiresAt: { $lte: now } },
        { status: "expired", hidden: true }
      );
      if (result.modifiedCount > 0) {
        console.log(`🧹 Expired ${result.modifiedCount} listing(s)`);
      }
    } catch (error) {
      console.error("Expiry job error", error);
    }
  }, CLEANUP_INTERVAL_MS);
}
