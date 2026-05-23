import { Document, model, Schema, Types } from "mongoose";

export interface IDefinedCard extends Document {
  eventId: Types.ObjectId;
  type: string;
  name: string;
  imageUrl: string;
  totalCount: number;
  // The user who created this card. Used to enforce: managers can only
  // modify/delete cards they created themselves; admins can modify any.
  // Optional because pre-migration cards may not have it set, in which case
  // they're treated as admin-only.
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

const definedCardSchema = new Schema<IDefinedCard>({
  eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
  type: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  totalCount: { type: Number, default: 0, min: 0 },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  createdAt: { type: Date, default: () => new Date() }
});

definedCardSchema.index({ eventId: 1, type: 1 });

export const DefinedCard = model<IDefinedCard>("DefinedCard", definedCardSchema);
