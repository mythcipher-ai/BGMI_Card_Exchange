import { Request, Response, NextFunction } from "express";
import { User } from "../models/User";

export async function getMe(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Missing authenticated user" });
    }

    res.json({
      id: user.id,
      role: user.role,
      status: user.status,
      auth0Id: user.auth0Id,
      email: user.email,
      name: user.name,
      picture: user.picture,
      trustScore: user.trustScore,
      totalClaims: user.totalClaims,
      successfulClaims: user.successfulClaims,
      reportsCount: user.reportsCount,
      dailyClaims: user.dailyClaims,
      createdAt: user.createdAt
    });
  } catch (error) {
    next(error);
  }
}

export async function syncProfile(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ message: "Missing authenticated user" });
    }

    const { name, picture } = req.body;
    const update: Record<string, string> = {};
    if (name && typeof name === "string") update.name = name;
    if (picture && typeof picture === "string") update.picture = picture;

    if (Object.keys(update).length > 0) {
      await User.findByIdAndUpdate(user.id, update);
    }

    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
}
