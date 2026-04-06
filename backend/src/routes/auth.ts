import { Router } from "express";
import { getMe, syncProfile } from "../controllers/authController";

export const authRouter = Router();

authRouter.get("/", getMe);
authRouter.post("/sync", syncProfile);
