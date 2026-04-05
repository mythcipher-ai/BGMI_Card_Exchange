import { Router } from "express";
import { getMe } from "../controllers/authController";

export const authRouter = Router();

authRouter.get("/", getMe);
