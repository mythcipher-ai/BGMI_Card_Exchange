import { Document, model, Schema, Types } from "mongoose";

export type GiftRequestStatus =
  | "pending"
  | "acknowledged"
  | "fulfilled"
  | "declined"
  | "expired";

export interface IGiftRequest extends Document {
  listingId: Types.ObjectId;
  fromUser: Types.ObjectId;
  toUser: Types.ObjectId;
  requesterName: string;
  requesterEmail?: string;
  message: string;
  popularityOffered: number;
  status: GiftRequestStatus;
  emailSent: boolean;
  emailError?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  expiresAt: Date;
}

const giftRequestSchema = new Schema<IGiftRequest>({
  listingId: { type: Schema.Types.ObjectId, ref: "CardListing", required: true, index: true },
  fromUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  toUser: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  requesterName: { type: String, required: true, trim: true, maxlength: 60 },
  // No longer collected from the client — defaults to the requester's
  // authenticated user email. Kept as optional to support providers that
  // don't expose an email.
  requesterEmail: { type: String, trim: true, lowercase: true, maxlength: 120, default: "" },
  message: { type: String, required: true, trim: true, maxlength: 500 },
  popularityOffered: { type: Number, default: 0, min: 0, max: 1000 },
  status: {
    type: String,
    enum: ["pending", "acknowledged", "fulfilled", "declined", "expired"],
    default: "pending",
    index: true
  },
  emailSent: { type: Boolean, default: false },
  emailError: { type: String },
  ipAddress: { type: String },
  userAgent: { type: String },
  createdAt: { type: Date, default: () => new Date() },
  expiresAt: {
    type: Date,
    default: () => new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days
  }
}, { timestamps: { createdAt: false, updatedAt: true } });

giftRequestSchema.index({ toUser: 1, status: 1, createdAt: -1 });
// Prevent same user from sending multiple OPEN requests to the same listing.
giftRequestSchema.index(
  { fromUser: 1, listingId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: { $in: ["pending", "acknowledged"] } },
    name: "one_open_request_per_user_per_listing"
  }
);

export const GiftRequest = model<IGiftRequest>("GiftRequest", giftRequestSchema);
