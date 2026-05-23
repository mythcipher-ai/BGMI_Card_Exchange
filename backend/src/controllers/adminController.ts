import { Request, Response, NextFunction } from "express";
import { Types } from "mongoose";
import { DefinedCard } from "../models/DefinedCard";
import { Event } from "../models/Event";
import { getS3ImageUrl, uploadToS3 } from "../utils/s3";

// Ownership gate. Admin can mutate anything; manager can only mutate items
// they created themselves. Pre-migration items with no createdBy are treated
// as admin-only.
function canMutate(role: string | undefined, ownerId: Types.ObjectId | undefined | null, actorId: string): boolean {
  if (role === "admin") return true;
  if (role !== "manager") return false;
  if (!ownerId) return false;
  return ownerId.toString() === actorId.toString();
}

const OWNERSHIP_ERROR = {
  code: "NOT_OWNER",
  message: "Only the user who created this item (or an admin) can modify or delete it."
};

// ---------- Image upload (shared by events and cards) ----------

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

// ---------- Event CRUD ----------

export async function getAllEvents(_req: Request, res: Response, next: NextFunction) {
  try {
    const events = await Event.find().sort({ createdAt: 1 }).lean();
    res.json({ data: events });
  } catch (error) {
    next(error);
  }
}

export async function createEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const { name, imageKey, imageUrl } = req.body;

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ message: "Event name is required" });
    }
    if (!imageKey && !imageUrl) {
      return res.status(400).json({ message: "Event image is required" });
    }

    const existing = await Event.findOne({ name: name.trim() });
    if (existing) {
      return res.status(409).json({ message: "An event with this name already exists" });
    }

    const finalUrl = imageUrl || getS3ImageUrl(imageKey);
    const event = await Event.create({
      name: name.trim(),
      imageUrl: finalUrl,
      createdBy: user.id
    });
    res.status(201).json(event);
  } catch (error) {
    next(error);
  }
}

export async function updateEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!canMutate(user.role, event.createdBy, user.id)) {
      return res.status(403).json(OWNERSHIP_ERROR);
    }

    const { name, imageKey, imageUrl, status } = req.body;
    if (name && typeof name === "string" && name.trim()) event.name = name.trim();
    if (imageUrl) event.imageUrl = imageUrl;
    else if (imageKey) event.imageUrl = getS3ImageUrl(imageKey);

    // Status changes are admin-only. A manager can pass any other field;
    // they just can't promote/demote events.
    if (status !== undefined) {
      if (user.role !== "admin") {
        return res.status(403).json({
          code: "ADMIN_REQUIRED_FOR_STATUS",
          message: "Only an admin can change an event's status."
        });
      }
      if (status !== "draft" && status !== "active") {
        return res.status(400).json({ message: "Status must be 'draft' or 'active'" });
      }
      event.status = status;
    }

    await event.save();
    res.json(event);
  } catch (error) {
    next(error);
  }
}

// Dedicated admin-only endpoint for flipping event status. Cleaner contract
// for the UI than reusing updateEvent.
export async function setEventStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });
    if (user.role !== "admin") {
      return res.status(403).json({
        code: "ADMIN_REQUIRED_FOR_STATUS",
        message: "Only an admin can change an event's status."
      });
    }
    const { id } = req.params;
    const { status } = req.body ?? {};
    if (status !== "draft" && status !== "active") {
      return res.status(400).json({ message: "Status must be 'draft' or 'active'" });
    }
    const event = await Event.findByIdAndUpdate(id, { status }, { new: true });
    if (!event) return res.status(404).json({ message: "Event not found" });
    res.json(event);
  } catch (error) {
    next(error);
  }
}

export async function deleteEvent(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const { id } = req.params;
    const event = await Event.findById(id);
    if (!event) return res.status(404).json({ message: "Event not found" });
    if (!canMutate(user.role, event.createdBy, user.id)) {
      return res.status(403).json(OWNERSHIP_ERROR);
    }

    // Refuse to drop an event that still has cards attached.
    const cardCount = await DefinedCard.countDocuments({ eventId: id });
    if (cardCount > 0) {
      return res.status(409).json({
        code: "EVENT_HAS_CARDS",
        message: `Cannot delete: this event still has ${cardCount} card(s). Move or delete them first.`
      });
    }

    await event.deleteOne();
    res.json({ message: "Event deleted" });
  } catch (error) {
    next(error);
  }
}

// ---------- DefinedCard CRUD ----------

export async function createDefinedCard(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const { eventId, type, name, imageKey, imageUrl } = req.body;

    if (!eventId || !type || !name || (!imageKey && !imageUrl)) {
      return res.status(400).json({ message: "eventId, type, name, and image are required" });
    }

    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(400).json({ message: "Invalid eventId" });
    }

    const existing = await DefinedCard.findOne({ name });
    if (existing) {
      return res.status(409).json({ message: "A card with this name already exists" });
    }

    const finalUrl = imageUrl || getS3ImageUrl(imageKey);

    const card = await DefinedCard.create({
      eventId,
      type,
      name,
      imageUrl: finalUrl,
      createdBy: user.id
    });
    res.status(201).json(card);
  } catch (error) {
    next(error);
  }
}

export async function updateDefinedCard(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const { id } = req.params;
    const card = await DefinedCard.findById(id);
    if (!card) return res.status(404).json({ message: "Card not found" });
    if (!canMutate(user.role, card.createdBy, user.id)) {
      return res.status(403).json(OWNERSHIP_ERROR);
    }

    const { eventId, type, name, imageKey, imageUrl, totalCount } = req.body;
    if (eventId) {
      const event = await Event.findById(eventId);
      if (!event) return res.status(400).json({ message: "Invalid eventId" });
      card.eventId = event._id as Types.ObjectId;
    }
    if (type) card.type = type;
    if (name) card.name = name;
    if (imageUrl) card.imageUrl = imageUrl;
    else if (imageKey) card.imageUrl = getS3ImageUrl(imageKey);
    if (totalCount) card.totalCount = totalCount;

    await card.save();
    res.json(card);
  } catch (error) {
    next(error);
  }
}

export async function deleteDefinedCard(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user;
    if (!user) return res.status(401).json({ message: "Authentication required" });

    const { id } = req.params;
    const card = await DefinedCard.findById(id);
    if (!card) return res.status(404).json({ message: "Card not found" });
    if (!canMutate(user.role, card.createdBy, user.id)) {
      return res.status(403).json(OWNERSHIP_ERROR);
    }

    await card.deleteOne();
    res.json({ message: "Card deleted" });
  } catch (error) {
    next(error);
  }
}

export async function getAllDefinedCards(_req: Request, res: Response, next: NextFunction) {
  try {
    const cards = await DefinedCard.find()
      .populate<{ eventId: any }>("eventId", "name imageUrl")
      .sort({ type: 1, name: 1 })
      .lean();
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
