import { Router } from "express";
import { 
  toggleSubscription, 
  getUserChannelSubscribers, 
  getSubscribedChannels 
} from "../controllers/subscription.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Toggle subscription (subscribe/unsubscribe)
router.post("/toggle/:channelId", verifyJWT, toggleSubscription);

// Get all subscribers of a channel
router.get("/channel/:channelId/subscribers", getUserChannelSubscribers);

// Get all channels a user has subscribed to
router.get("/user/:subscriberId/channels", getSubscribedChannels);

export default router;
