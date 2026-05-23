import { Document, model, Schema, Types } from "mongoose";

export type ListingStatus = "active" | "claimed" | "expired";
// After a successful claim a listing enters "pending" outcome. The owner then
// resolves it to "confirmed" (they received their wanted card in-game and the
// trade counts) or "disputed" (claimer didn't deliver — claimer gets flagged).
export type TradeOutcome = "pending" | "confirmed" | "disputed";

export interface ICardListing extends Document {
  createdBy: Types.ObjectId;
  // Pool of cards the lister is willing to GIVE (1-3). The buyer redeems the
  // single trade code in-game and picks one of these to actually receive.
  offeringCards: string[];
  offeringCardIds?: Types.ObjectId[];
  // The single card the lister WANTS back in exchange.
  wantedCard: string;
  wantedCardId?: Types.ObjectId;
  code: string;
  // Deterministic HMAC of the plaintext code. Used to detect duplicates
  // across users and over time without storing/exposing the plaintext.
  codeHash?: string;
  status: ListingStatus;
  claimCount: number;
  reports: number;
  hidden: boolean;
  popularityOffered: number;
  // Set when status becomes "claimed". Drives the post-claim confirmation UI.
  tradeOutcome?: TradeOutcome;
  claimedBy?: Types.ObjectId;
  claimedAt?: Date;
  outcomeAt?: Date;
  disputeReason?: string;
  createdAt: Date;
  expiresAt: Date;
}

const cardListingSchema = new Schema<ICardListing>({
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  offeringCards: {
    type: [String],
    validate: [(arr: string[]) => arr.length > 0 && arr.length <= 3, "offeringCards must contain 1-3 values"],
    required: true
  },
  offeringCardIds: [{ type: Schema.Types.ObjectId, ref: "DefinedCard" }],
  wantedCard: { type: String, required: true },
  wantedCardId: { type: Schema.Types.ObjectId, ref: "DefinedCard" },
  code: { type: String, required: true },
  codeHash: { type: String, index: true },
  status: { type: String, enum: ["active", "claimed", "expired"], default: "active" },
  claimCount: { type: Number, default: 0 },
  reports: { type: Number, default: 0 },
  hidden: { type: Boolean, default: false },
  popularityOffered: { type: Number, default: 0, min: 0 },
  tradeOutcome: { type: String, enum: ["pending", "confirmed", "disputed"], index: true },
  claimedBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  claimedAt: { type: Date },
  outcomeAt: { type: Date },
  disputeReason: { type: String, maxlength: 400 },
  createdAt: { type: Date, default: () => new Date() },
  expiresAt: { type: Date, required: true }
});

// One ACTIVE listing per user.
// Historic (claimed/expired) listings are unconstrained — only the active row is unique.
cardListingSchema.index(
  { createdBy: 1 },
  {
    unique: true,
    partialFilterExpression: { status: "active" },
    name: "one_active_listing_per_user"
  }
);

cardListingSchema.index({ status: 1, hidden: 1, createdAt: -1 });

export const CardListing = model<ICardListing>("CardListing", cardListingSchema);
