import mongoose from "mongoose";
import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/likes.models.js";
import APIerror from "../utils/apiError.js";
import { ApiResponse } from "../utils/apiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// Get overall channel statistics
const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id; // assuming verifyJWT middleware sets req.user

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // 1. Total videos
    const totalVideos = await Video.countDocuments({ owner: channelId });

    // 2. Total views (aggregate all video views)
    const viewsAgg = await Video.aggregate([
        { $match: { owner: channelId } },
        { $group: { _id: null, totalViews: { $sum: "$views" } } }
    ]);
    const totalViews = viewsAgg.length > 0 ? viewsAgg[0].totalViews : 0;

    // 3. Total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    // 4. Total likes across all videos of this channel
    const userVideos = await Video.find({ owner: channelId }).select("_id");
    const videoIds = userVideos.map(v => v._id);
    const totalLikes = videoIds.length > 0 
        ? await Like.countDocuments({ video: { $in: videoIds } }) 
        : 0;

    return res.status(200).json(
        new ApiResponse(
            200,
            {
                totalVideos,
                totalViews,
                totalSubscribers,
                totalLikes
            },
            "Channel stats fetched successfully"
        )
    );
});

// Get all videos uploaded by the channel
const getChannelVideos = asyncHandler(async (req, res) => {
    const channelId = req.user._id;

    if (!mongoose.isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    );
});

export {
    getChannelStats, 
    getChannelVideos
};
