import { Document, model, Schema, Types } from "mongoose";

export interface IReport extends Document {
  listingId: Types.ObjectId;
  reportedBy: Types.ObjectId;
  reason?: string;
  createdAt: Date;
  ipAddress: string;
  userAgent?: string;
}

const reportSchema = new Schema<IReport>({
  listingId: { type: Schema.Types.ObjectId, ref: "CardListing", required: true },
  reportedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  reason: { type: String },
  createdAt: { type: Date, default: () => new Date() },
  ipAddress: { type: String, required: true },
  userAgent: { type: String }
});

export const Report = model<IReport>("Report", reportSchema);
