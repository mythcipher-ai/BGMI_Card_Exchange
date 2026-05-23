import { Router } from "express";
import multer from "multer";
import { requireAdmin, requireStaff } from "../middleware/adminAuth";
import { validateObjectId } from "../middleware/validateObjectId";
import {
  createDefinedCard,
  updateDefinedCard,
  deleteDefinedCard,
  getAllDefinedCards,
  getCardTypes,
  uploadImage,
  getAllEvents,
  createEvent,
  updateEvent,
  deleteEvent,
  setEventStatus
} from "../controllers/adminController";
import {
  getAllUsers,
  getUserDetail,
  blockUser,
  unblockUser,
  setUserRole
} from "../controllers/userManagementController";
import {
  adminListRewardRequests,
  adminSetRewardStatus
} from "../controllers/rewardsController";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

export const adminRouter = Router();

// Readable by any authenticated user (populate dropdowns).
adminRouter.get("/cards", getAllDefinedCards);
adminRouter.get("/cards/types", getCardTypes);
adminRouter.get("/events", getAllEvents);

// Card + event admin: admin OR manager.
adminRouter.post("/upload", requireStaff, upload.single("image"), uploadImage);

adminRouter.post("/events", requireStaff, createEvent);
adminRouter.put("/events/:id", requireStaff, validateObjectId, updateEvent);
adminRouter.patch("/events/:id/status", requireAdmin, validateObjectId, setEventStatus);
adminRouter.delete("/events/:id", requireStaff, validateObjectId, deleteEvent);

adminRouter.post("/cards", requireStaff, createDefinedCard);
adminRouter.put("/cards/:id", requireStaff, validateObjectId, updateDefinedCard);
adminRouter.delete("/cards/:id", requireStaff, validateObjectId, deleteDefinedCard);

// User management + role assignment: admin only. Managers are blocked here.
adminRouter.get("/users", requireAdmin, getAllUsers);
adminRouter.get("/users/:id", requireAdmin, validateObjectId, getUserDetail);
adminRouter.post("/users/:id/block", requireAdmin, validateObjectId, blockUser);
adminRouter.post("/users/:id/unblock", requireAdmin, validateObjectId, unblockUser);
adminRouter.patch("/users/:id/role", requireAdmin, validateObjectId, setUserRole);

// Reward request moderation: admin only.
adminRouter.get("/rewards", requireAdmin, adminListRewardRequests);
adminRouter.patch("/rewards/:id/status", requireAdmin, validateObjectId, adminSetRewardStatus);
