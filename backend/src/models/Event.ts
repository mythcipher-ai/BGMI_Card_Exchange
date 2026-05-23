import { Document, model, Schema, Types } from "mongoose";

export type EventStatus = "draft" | "active";

// An "Event" is the top-level umbrella for cards (e.g. "JJK", "Blue Lock S1").
// Each Event contains multiple categories (DefinedCard.type), and each category
// contains the individual cards (DefinedCard).
export interface IEvent extends Document {
  name: string;
  imageUrl: string;
  // Lifecycle status.
  //   draft  = visible only in Admin UI; users cannot list cards from it.
  //   active = visible to everyone; user-side AddCard form can list its cards.
  // Only admins can flip status. New events start as "draft" so a manager can
  // create + populate them, but only an admin can publish them.
  status: EventStatus;
  // The user who created this event. Used to enforce: managers can only
  // modify/delete events they created themselves; admins can modify any.
  // Optional because pre-migration events may not have it set, in which case
  // they're treated as admin-only.
  createdBy?: Types.ObjectId;
  createdAt: Date;
}

const eventSchema = new Schema<IEvent>({
  name: { type: String, required: true, unique: true, trim: true, maxlength: 80 },
  imageUrl: { type: String, required: true },
  status: { type: String, enum: ["draft", "active"], default: "draft", index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", index: true },
  createdAt: { type: Date, default: () => new Date() }
});

export const Event = model<IEvent>("Event", eventSchema);
