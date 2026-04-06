import { Router } from "express";
import { createListing, deleteListing, getListings, getMyListings } from "../controllers/listingsController";
import { validateObjectId } from "../middleware/validateObjectId";

export const listingsRouter = Router();

listingsRouter.get("/", getListings);
listingsRouter.get("/mine", getMyListings);
listingsRouter.post("/", createListing);
listingsRouter.delete("/:id", validateObjectId, deleteListing);
