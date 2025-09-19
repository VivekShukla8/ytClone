import { Router } from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js"
import {toggleVideoLike,toggleCommentLike,toggleTweetLike,getLikedVideos} from "../controllers/like.controller.js"

const router = Router()

// ----- Toggle Likes -----
router.post("/video/:videoId/toggle", verifyJWT, toggleVideoLike);
router.post("/comment/:commentId/toggle", verifyJWT, toggleCommentLike);
router.post("/tweet/:tweetId/toggle", verifyJWT, toggleTweetLike);

// ----- Get Liked Entities -----
router.get("/videos/:userId", verifyJWT, getLikedVideos);


export default router;