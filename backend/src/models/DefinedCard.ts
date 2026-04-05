import { Document, model, Schema } from "mongoose";

export interface IDefinedCard extends Document {
  type: string;
  name: string;
  imageUrl: string;
  totalCount: number;
  createdAt: Date;
}

const definedCardSchema = new Schema<IDefinedCard>({
  type: { type: String, required: true },
  name: { type: String, required: true, unique: true },
  imageUrl: { type: String, required: true },
  totalCount: { type: Number, required: true, min: 1 },
  createdAt: { type: Date, default: () => new Date() }
});

definedCardSchema.index({ type: 1 });

export const DefinedCard = model<IDefinedCard>("DefinedCard", definedCardSchema);
