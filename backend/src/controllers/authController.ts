import { Request, Response, NextFunction } from "express";

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
