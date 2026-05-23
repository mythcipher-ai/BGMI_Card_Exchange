import { model, Schema, Document } from "mongoose";

export type UserRole = "user" | "admin" | "manager";
export type UserStatus = "active" | "blocked";

export interface IUserNotifications {
  giftRequests: boolean;
}

export interface IUser extends Document {
  auth0Id: string;
  email?: string;
  name?: string;
  picture?: string;
  role: UserRole;
  status: UserStatus;
  trustScore: number;
  totalClaims: number;
  successfulClaims: number;
  reportsCount: number;
  lastClaimedAt?: Date;
  dailyClaims: number;
  dailyClaimsResetAt: Date;
  hasActiveListing: boolean;
  instagramHandle?: string;
  notifications: IUserNotifications;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  auth0Id: { type: String, required: true, unique: true },
  email: { type: String },
  name: { type: String },
  picture: { type: String },
  role: { type: String, enum: ["user", "admin", "manager"], default: "user" },
  status: { type: String, enum: ["active", "blocked"], default: "active" },
  trustScore: { type: Number, default: 0 },
  totalClaims: { type: Number, default: 0 },
  successfulClaims: { type: Number, default: 0 },
  reportsCount: { type: Number, default: 0 },
  lastClaimedAt: { type: Date },
  dailyClaims: { type: Number, default: 0 },
  dailyClaimsResetAt: { type: Date, default: () => new Date() },
  hasActiveListing: { type: Boolean, default: false, index: true },
  instagramHandle: { type: String, trim: true, maxlength: 40 },
  notifications: {
    type: new Schema<IUserNotifications>({
      giftRequests: { type: Boolean, default: true }
    }, { _id: false }),
    default: () => ({ giftRequests: true })
  },
  createdAt: { type: Date, default: () => new Date() }
});

export const User = model<IUser>("User", userSchema);
