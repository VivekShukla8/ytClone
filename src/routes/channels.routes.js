import { Router } from "express";
import { getChannelStats, getChannelVideos } from "../controllers/channel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

// Get stats for the logged-in channel
router.get("/stats", verifyJWT, getChannelStats);

// Get all videos uploaded by the logged-in channel
router.get("/videos", verifyJWT, getChannelVideos);

export default router;
