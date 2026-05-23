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
  // Count of this user's listings that have been successfully claimed by
  // another real user. Source of truth for milestone rewards.
  successfulTrades: number;
  // Number of times the user (as a claimer) was flagged by a lister for not
  // delivering on their side of a confirmed-pending trade. Admin uses this for
  // suspend/ban decisions; nothing here is automated.
  flagCount: number;
  reportsCount: number;
  lastClaimedAt?: Date;
  dailyClaims: number;
  dailyClaimsResetAt: Date;
  hasActiveListing: boolean;
  instagramHandle?: string;
  // Last BGMI in-game UID the user entered while claiming a reward.
  // Stored so we can auto-fill subsequent reward claims.
  bgmiUid?: string;
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
  successfulTrades: { type: Number, default: 0, min: 0, index: true },
  flagCount: { type: Number, default: 0, min: 0, index: true },
  reportsCount: { type: Number, default: 0 },
  lastClaimedAt: { type: Date },
  dailyClaims: { type: Number, default: 0 },
  dailyClaimsResetAt: { type: Date, default: () => new Date() },
  hasActiveListing: { type: Boolean, default: false, index: true },
  instagramHandle: { type: String, trim: true, maxlength: 40 },
  bgmiUid: { type: String, trim: true, match: /^\d{11}$/ },
  notifications: {
    type: new Schema<IUserNotifications>({
      giftRequests: { type: Boolean, default: true }
    }, { _id: false }),
    default: () => ({ giftRequests: true })
  },
  createdAt: { type: Date, default: () => new Date() }
});

export const User = model<IUser>("User", userSchema);
