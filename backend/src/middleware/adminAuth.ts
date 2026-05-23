import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth";

// Strict admin gate. Only "admin" passes.
// Used for: user management, role changes, anything that grants/removes power.
export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== "admin") {
    res.status(403).json({ message: "Admin access required" });
    return;
  }
  next();
};

// Staff gate. Admin OR manager passes.
// Used for: card management endpoints. Managers can touch cards but never users.
export const requireStaff = (req: AuthRequest, res: Response, next: NextFunction) => {
  const role = req.user?.role;
  if (!req.user || (role !== "admin" && role !== "manager")) {
    res.status(403).json({ message: "Card management access required" });
    return;
  }
  next();
};
