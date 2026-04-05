import { model, Schema, Document } from "mongoose";

export type UserRole = "user" | "admin";
export type UserStatus = "active" | "blocked";

export interface IUser extends Document {
  auth0Id: string;
  email?: string;
  role: UserRole;
  status: UserStatus;
  trustScore: number;
  totalClaims: number;
  successfulClaims: number;
  reportsCount: number;
  lastClaimedAt?: Date;
  dailyClaims: number;
  dailyClaimsResetAt: Date;
  createdAt: Date;
}

const userSchema = new Schema<IUser>({
  auth0Id: { type: String, required: true, unique: true },
  email: { type: String },
  role: { type: String, enum: ["user", "admin"], default: "user" },
  status: { type: String, enum: ["active", "blocked"], default: "active" },
  trustScore: { type: Number, default: 0 },
  totalClaims: { type: Number, default: 0 },
  successfulClaims: { type: Number, default: 0 },
  reportsCount: { type: Number, default: 0 },
  lastClaimedAt: { type: Date },
  dailyClaims: { type: Number, default: 0 },
  dailyClaimsResetAt: { type: Date, default: () => new Date() },
  createdAt: { type: Date, default: () => new Date() }
});

export const User = model<IUser>("User", userSchema);
