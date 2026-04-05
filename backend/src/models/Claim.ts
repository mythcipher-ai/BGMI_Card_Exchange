import { Document, model, Schema, Types } from "mongoose";

export type ClaimStatus = "claimed" | "confirmed" | "disputed";

export interface IClaim extends Document {
  listingId: Types.ObjectId;
  claimedBy: Types.ObjectId;
  revealedCode: string;
  status: ClaimStatus;
  createdAt: Date;
  ipAddress: string;
  userAgent?: string;
}

const claimSchema = new Schema<IClaim>({
  listingId: { type: Schema.Types.ObjectId, ref: "CardListing", required: true },
  claimedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  revealedCode: { type: String, required: true },
  status: { type: String, enum: ["claimed", "confirmed", "disputed"], default: "claimed" },
  createdAt: { type: Date, default: () => new Date() },
  ipAddress: { type: String, required: true },
  userAgent: { type: String }
});

export const Claim = model<IClaim>("Claim", claimSchema);
