import mongoose, {isValidObjectId} from "mongoose"
import {Likes} from "../models/likes.models.js"
import APIerror from "../utils/apiError.js"
import { ApiResponse } from "../utils/apiResponse.js"
import { Video } from "../models/video.models.js"
import asyncHandler from "../utils/asyncHandler.js"
import { Comment } from "../models/comment.models.js"
import {Tweet} from "../models/tweets.models.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    // Validate ObjectId
    if (!mongoose.isValidObjectId(videoId)) {
        throw new APIerror(400, "Invalid video ID");
    }

    const userId = req.user._id;

    // Ensure video exists
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new APIerror(404, "Video not found");
    }

    // Try to unlike if already liked
    const existingLike = await Likes.findOneAndDelete({ video: videoId, likedBy: userId });

    if (existingLike) {
        return res.status(200).json(
            new ApiResponse(
                200,
                { removed: true },
                "Video unliked successfully"
            )
        );
    }

    // Otherwise, create a new like
    const newLike = await Likes.create({
        video: videoId,
        likedBy: userId,
    });

    return res.status(200).json(
        new ApiResponse(
            200,
            newLike,
            "Video liked successfully"
        )
    );
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!mongoose.isValidObjectId(commentId)){
        throw new APIerror(400,"Invalid Comment Id.")
    }

   const userId = req.user._id;

    // Ensure comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new APIerror(404, "Comment not found");
    }

    // Already liked? → Unlike
    const existingLike = await Likes.findOneAndDelete({ comment: commentId, likedBy: userId });

    if (existingLike) {
        return res.status(200).json(
            new ApiResponse(
                200,
                { removed: true },
                "Comment unliked successfully"
            )
        );
    }
     
    // Not liked yet
    const newLike = await Likes.create(
        {
            comment:commentId,
            likedBy:userId
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newLike,
            "Comment liked successfully."
        )
    )
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    
    if(!mongoose.isValidObjectId(tweetId)){
        throw new APIerror(400,"Invalid tweet Id");
    }


    const userId = req.user._id;

    // Ensure tweet exists
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new APIerror(404, "Tweet not found");
    }

    // Already liked? → Unlike
    const existingLike = await Likes.findOneAndDelete({ tweet: tweetId, likedBy: userId });

    if (existingLike) {
        return res.status(200).json(
            new ApiResponse(
                200,
                { removed: true },
                "Tweet unliked successfully"
            )
        );
    }

    const newLike = await Likes.create(
        {
            tweet:tweetId,
            likedBy:userId
        }
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            newLike,
            "Tweet liked successfully."
        )
    )
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const {userId} = req.params;

    if(!mongoose.isValidObjectId(userId)){
        throw new APIerror(400,"User Id is invalid");
    }

    const likedVideos = await Likes.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(userId),
                video:{ $ne :null}
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoDetails"
            }
        },
          { $unwind: "$videoDetails" },
        {
            $project: {
                _id: 0,
                likedAt: "$createdAt",
                "videoDetails._id": 1,
                "videoDetails.title": 1,
                "videoDetails.thumbnail": 1,
                "videoDetails.duration": 1
            }
        },
        { $sort: { likedAt: -1 } }
    ])


    return res
    .status(200)
    .json(new ApiResponse(
        200,
        likedVideos,
        "All liked videos fetched successfully."
    ))
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}