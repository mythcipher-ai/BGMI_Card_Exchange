import { Router } from "express";
import multer from "multer";
import { requireAdmin } from "../middleware/adminAuth";
import { validateObjectId } from "../middleware/validateObjectId";
import {
  createDefinedCard,
  updateDefinedCard,
  deleteDefinedCard,
  getAllDefinedCards,
  getCardTypes,
  uploadImage
} from "../controllers/adminController";
import {
  getAllUsers,
  getUserDetail,
  blockUser,
  unblockUser
} from "../controllers/userManagementController";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files are allowed"));
  },
});

export const adminRouter = Router();

// Public routes — any authenticated user can read defined cards
adminRouter.get("/cards", getAllDefinedCards);
adminRouter.get("/cards/types", getCardTypes);

// Admin-only card routes
adminRouter.post("/upload", requireAdmin, upload.single("image"), uploadImage);
adminRouter.post("/cards", requireAdmin, createDefinedCard);
adminRouter.put("/cards/:id", requireAdmin, validateObjectId, updateDefinedCard);
adminRouter.delete("/cards/:id", requireAdmin, validateObjectId, deleteDefinedCard);

// Admin-only user management routes
adminRouter.get("/users", requireAdmin, getAllUsers);
adminRouter.get("/users/:id", requireAdmin, validateObjectId, getUserDetail);
adminRouter.post("/users/:id/block", requireAdmin, validateObjectId, blockUser);
adminRouter.post("/users/:id/unblock", requireAdmin, validateObjectId, unblockUser);
