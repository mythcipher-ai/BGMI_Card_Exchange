import { Request, Response, NextFunction } from "express";
import { DefinedCard } from "../models/DefinedCard";
import { getS3ImageUrl, uploadToS3 } from "../utils/s3";

export async function uploadImage(req: Request, res: Response, next: NextFunction) {
  try {
    const file = req.file;
    if (!file) {
      return res.status(400).json({ message: "No image file provided" });
    }

    const { key, url } = await uploadToS3(file.buffer, file.originalname, file.mimetype);
    res.json({ key, url });
  } catch (error) {
    next(error);
  }
}

export async function createDefinedCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { type, name, imageKey, imageUrl } = req.body;

    if (!type || !name || (!imageKey && !imageUrl)) {
      return res.status(400).json({ message: "type, name, and image are required" });
    }

    const existing = await DefinedCard.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "A card with this name already exists" });
    }

    const finalUrl = imageUrl || getS3ImageUrl(imageKey);

    const card = await DefinedCard.create({ type, name, imageUrl: finalUrl });
    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
}

export async function updateDefinedCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const { type, name, imageKey, imageUrl, totalCount } = req.body;

    const update: any = {};
    if (type) update.type = type;
    if (name) update.name = name;
    if (imageUrl) update.imageUrl = imageUrl;
    else if (imageKey) update.imageUrl = getS3ImageUrl(imageKey);
    if (totalCount) update.totalCount = totalCount;

    const card = await DefinedCard.findByIdAndUpdate(id, update, { new: true });
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }

    res.json(card);
  } catch (error) {
    next(error);
  }
}

export async function deleteDefinedCard(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params;
    const card = await DefinedCard.findByIdAndDelete(id);
    if (!card) {
      return res.status(404).json({ message: "Card not found" });
    }
    res.json({ message: "Card deleted" });
  } catch (error) {
    next(error);
  }
}

export async function getAllDefinedCards(_req: Request, res: Response, next: NextFunction) {
  try {
    const cards = await DefinedCard.find().sort({ type: 1, name: 1 }).lean();
    res.json({ data: cards });
  } catch (error) {
    next(error);
  }
}

export async function getCardTypes(_req: Request, res: Response, next: NextFunction) {
  try {
    const types = await DefinedCard.distinct("type");
    res.json({ data: types });
  } catch (error) {
    next(error);
  }
}
