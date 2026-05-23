import { Document, model, Schema, Types } from "mongoose";

export type ListingStatus = "active" | "claimed" | "expired";

export interface ICardListing extends Document {
  createdBy: Types.ObjectId;
  offeringCard: string;
  offeringCardId?: Types.ObjectId;
  offeringCount: number;
  wantedCards: string[];
  wantedCardIds?: Types.ObjectId[];
  code: string;
  status: ListingStatus;
  claimCount: number;
  reports: number;
  hidden: boolean;
  popularityOffered: number;
  createdAt: Date;
  expiresAt: Date;
}

const cardListingSchema = new Schema<ICardListing>({
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  offeringCard: { type: String, required: true },
  offeringCardId: { type: Schema.Types.ObjectId, ref: "DefinedCard" },
  offeringCount: { type: Number, default: 1, min: 1 },
  wantedCards: { type: [String], validate: [(arr: string[]) => arr.length > 0 && arr.length <= 3, "wantedCards must contain 1-3 values"], required: true },
  wantedCardIds: [{ type: Schema.Types.ObjectId, ref: "DefinedCard" }],
  code: { type: String, required: true },
  status: { type: String, enum: ["active", "claimed", "expired"], default: "active" },
  claimCount: { type: Number, default: 0 },
  reports: { type: Number, default: 0 },
  hidden: { type: Boolean, default: false },
  popularityOffered: { type: Number, default: 0, min: 0 },
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
