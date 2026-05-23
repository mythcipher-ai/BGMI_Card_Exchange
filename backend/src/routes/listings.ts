import { Router } from "express";
import {
  createListing,
  deleteListing,
  getListings,
  getMyListings,
  confirmTradeReceived,
  disputeTrade
} from "../controllers/listingsController";
import { validateObjectId } from "../middleware/validateObjectId";

export const listingsRouter = Router();

listingsRouter.get("/", getListings);
listingsRouter.get("/mine", getMyListings);
listingsRouter.post("/", createListing);
listingsRouter.post("/:id/confirm-received", validateObjectId, confirmTradeReceived);
listingsRouter.post("/:id/dispute", validateObjectId, disputeTrade);
listingsRouter.delete("/:id", validateObjectId, deleteListing);
