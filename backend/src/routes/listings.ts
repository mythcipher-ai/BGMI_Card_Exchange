import { Router } from "express";
import {
  createListing,
  deleteListing,
  getListings,
  getMyListings,
  confirmTradeReceived,
  disputeTrade,
  markListingExternal
} from "../controllers/listingsController";
import { validateObjectId } from "../middleware/validateObjectId";

export const listingsRouter = Router();

listingsRouter.get("/", getListings);
listingsRouter.get("/mine", getMyListings);
listingsRouter.post("/", createListing);
listingsRouter.post("/:id/confirm-received", validateObjectId, confirmTradeReceived);
listingsRouter.post("/:id/dispute", validateObjectId, disputeTrade);
listingsRouter.post("/:id/mark-external", validateObjectId, markListingExternal);
listingsRouter.delete("/:id", validateObjectId, deleteListing);
