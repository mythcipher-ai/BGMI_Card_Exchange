import { Document, model, Schema, Types } from "mongoose";

export type RewardStatus = "pending" | "approved" | "delivered" | "rejected";

export interface IRewardRequest extends Document {
  userId: Types.ObjectId;
  // The milestone threshold the user is claiming (1, 3, 5, 10, 15, 20).
  // This is the natural key for "which milestone" — never store the index.
  milestone: number;
  popularityAmount: number;
  // BGMI in-game UID the user entered. 11 digits, numeric only.
  bgmiUid: string;
  status: RewardStatus;

  // Trade count at the moment of claim. Stored so admin can audit and so we
  // can detect tampering if the live count ever doesn't match.
  successfulTradesAtClaim: number;

  // Audit trail.
  approvedBy?: Types.ObjectId;
  approvedAt?: Date;
  deliveredAt?: Date;
  rejectedAt?: Date;
  rejectionReason?: string;

  createdAt: Date;
  updatedAt: Date;
}

const rewardRequestSchema = new Schema<IRewardRequest>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  milestone: { type: Number, required: true, min: 1 },
  popularityAmount: { type: Number, required: true, min: 0 },
  bgmiUid: { type: String, required: true, trim: true, match: /^\d{11}$/ },
  status: {
    type: String,
    enum: ["pending", "approved", "delivered", "rejected"],
    default: "pending",
    index: true
  },
  successfulTradesAtClaim: { type: Number, required: true, min: 0 },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt: { type: Date },
  deliveredAt: { type: Date },
  rejectedAt: { type: Date },
  rejectionReason: { type: String, maxlength: 500 }
}, { timestamps: true });

// One claim per user per milestone, forever. This is THE defense against
// double-claims; controllers just produce nicer error messages.
rewardRequestSchema.index(
  { userId: 1, milestone: 1 },
  { unique: true, name: "one_claim_per_user_per_milestone" }
);

rewardRequestSchema.index({ status: 1, createdAt: -1 });

export const RewardRequest = model<IRewardRequest>("RewardRequest", rewardRequestSchema);
