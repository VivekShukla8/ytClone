import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { 
    createTweet, 
    getUserTweets, 
    updateTweet, 
    deleteTweet 
} from "../controllers/tweet.controller.js";

const router = Router();

// Create a new tweet
router.post("/", verifyJWT, createTweet);

// Get all tweets of the logged-in user
router.get("/my-tweets", verifyJWT, getUserTweets);

// Update a tweet by ID
router.put("/:tweetId", verifyJWT, updateTweet);

// Delete a tweet by ID
router.delete("/:tweetId", verifyJWT, deleteTweet);

export default router;
