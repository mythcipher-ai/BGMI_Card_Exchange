import { Request, Response, NextFunction } from "express";
import { isValidObjectId } from "mongoose";

export function validateObjectId(req: Request, res: Response, next: NextFunction) {
  const id = req.params.id || req.params.listingId;
  if (!id || !isValidObjectId(id)) {
    return res.status(400).json({ message: "Invalid object id" });
  }
  next();
}
