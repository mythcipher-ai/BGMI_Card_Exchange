import { Router } from "express";
import { createListing, deleteListing, getListings } from "../controllers/listingsController";
import { validateObjectId } from "../middleware/validateObjectId";

export const listingsRouter = Router();

listingsRouter.get("/", getListings);
listingsRouter.post("/", createListing);
listingsRouter.delete("/:id", validateObjectId, deleteListing);
