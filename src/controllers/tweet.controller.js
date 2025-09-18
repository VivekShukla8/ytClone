import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweets.models.js"
import APIerror from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import asyncHandler from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const owner = req.user._id;
    const {content} = req.body;

    if (!content || content.trim() === "") {
        res.status(400);
        throw new Error("Tweet content cannot be empty");
    }

    const tweet = await Tweet.create({
        content,
        owner:owner
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            tweet,
            "Tweet created successfully"
        )
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const owner = req.user._id;

    if(!owner){
        throw new APIerror(400, "User not authenticated.");
    }

    const tweets = await Tweet.find({owner})
    .sort({createdAt:-1})
    .populate("owner", "username fullname");

    if (!tweets || tweets.length === 0) {
        throw new APIerror(404, "No tweets found for this user.");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets,
            "All the tweets of user have been fetched successfully."
        )
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    if(!mongoose.isValidObjectId(tweetId)){
        throw new APIerror(400,"Invalid Tweet id.")
    }

    const tweet = await Tweet.findById(tweetId);
     if (!tweet) {
        throw new APIerror(404, "Tweet not found.");
    }

    // Authenticate
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new APIerror(403, "You are not authorized to update this tweet.");
    }

    const {content} = req.body;
    if (!content || content.trim() === "") {
        throw new APIerror(400, "Tweet content cannot be empty.");
    }

    tweet.content=content;
    await tweet.save();

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;

    if (!mongoose.isValidObjectId(tweetId)) {
        throw new APIerror(400, "Invalid Tweet id.");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new APIerror(404, "Tweet not found.");
    }

    // Authenticate
    if (tweet.owner.toString() !== req.user._id.toString()) {
        throw new APIerror(403, "You are not authorized to delete this tweet.");
    }

    await tweet.deleteOne();

    return res.status(200).json(
        new ApiResponse(
            200,
            null,
            "Tweet deleted successfully"
        )
    );
});


export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}
