import APIerror from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken"
import fs from "fs";
import mongoose from "mongoose";

const generateAccessAndRefreshAccessTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) throw new APIerror(404, "User not found");
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave:false})

        return {accessToken,refreshToken}
    } catch (error) {
        throw new APIerror(500,"Something went wrong while generating tokens")
    }
}

const registerUser = asyncHandler( async (req,res) => {
    // get details from user -> validation - not empty / same or not
    // check if already exits?
    // check for images -> avatar
    // if available then upload them to clodinary
    // create user object and then save it to db
    // remove password and refresh token from response
    // check for user creation
    // return response

    // get data -> if data from form/json -> use body
    const {username, email, fullname, password} = req.body;

    //validation - not empty / same or not
    if(
        [username,email,fullname,password].some( (field) => field?.trim() === "")
    ){
        throw new APIerror(400,"field is required")
    }

    // check if already exits?
    const existedUser = await User.findOne({
        $or:[ { username }, { email }]
    })
    if(existedUser){
        throw new APIerror(409, "User with username or email is already registered")
    }

    // check for images availability on local storage
    const avatarLocalPath = req.files?.avatar[0]?.path         //accessing file-> without cloudinary

    const coverImageLocalPath = req.files?.coverImage && req.files.coverImage.length > 0
                                ? req.files.coverImage[0].path : "";

    
    //check for avatar
    if(!avatarLocalPath){
        throw new APIerror(400,"Avatar image is required")
    }

    // if available then upload them to clodinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImg = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new APIerror(400,"Avatar image is required")
    }

    // create user object and then save it to db
    const user = await User.create({
        username,
        email, 
        fullname,
        password,
        avatar:avatar.url,
        coverImage:coverImg?.url || ""
    }
    )

    // Checking if successfully created or not -> remove password and refresh token from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new APIerror(500,"Something went wrong while registeration")
    }

    // Successfully created -> Give response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )


    // console.log("email:",email);
})

const loginUser = asyncHandler( async (req,res) => {
    // req body -> data access 
    // username or email validation
    // find user from db
    // if not found -> error
    // if found -> compare password
    // if not match -> error
    // if match -> create access token and refresh token 
    // send cookie in response -> refresh token

    //step 1->
    const {username,email,password} = req.body;

    // step 2->
    if (!(username || email)) {
        throw new APIerror(400, "username or email is required");
    }


    // step 3->
    const user = await User.findOne({
        $or:[{email},{username}]
    })

    // step 4->
    if(!user){
        throw new APIerror(404,"user does not exist")
    }

    // step 5->
    const isPasswordValid = await user.isPasswordCorrect(password)

    // step 6->
    if(!isPasswordValid){
        throw new APIerror(402,"Please enter correct password")
    }

    // step 7->
    const {accessToken,refreshToken} = await generateAccessAndRefreshAccessTokens(user._id)

    // step 8->
    const loggedinUser = await User.findById(user._id).select("-password -refreshToken ")

    // cookies send
    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedinUser,accessToken,refreshToken
            },
            "User is successfully logged in"
        )
    )
})

const logoutUser = asyncHandler(async(req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:undefined
            }
        }
    )

    const options = {
        httpOnly: true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken //Stored token

    if(!incomingRefreshToken){
        throw new APIerror(401,"unauthorized request")
    }

    //verify that token
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new APIerror(404,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new APIerror(404,"Refresh token is expired or invalid")
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshAccessTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken:newRefreshToken
                },
                "Access token refreshed successfully"
            )
        )
    } catch (error) {
        throw new APIerror(401,error?.message || "Invalid refresh token")
    }
})


const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    const user = await User.findById(req.user?._id);

    if (!user) {
        throw new APIerror(404, "User not found");
    }

    const isPasswordCorrectChecker = await user.isPasswordCorrect(oldPassword);
    if (!isPasswordCorrectChecker) {
        throw new APIerror(400, "Invalid old password");
    }

    user.password = newPassword; // will trigger pre-save hook for hashing
    await user.save();

    return res.status(200).json(
        new ApiResponse(
            200,
            {},
            "Password changed successfully"
        )
    );
});

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(
        200,
        req.user,
        "current user fetched successfully"
    ))
})

const updateAccount = asyncHandler(async(req,res)=>{
    const {fullname,email} = req.body;  

    if(!fullname || !email){
        throw new APIerror(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                fullname,
                email:email
            }
        },
        {new:true}
    ).select("-password")


    return res
    .status(200)
    .json(new ApiResponse(200,
        user,
        "Email and username changed successfully"
    ))
})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new APIerror(404, "Avatar not found");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar?.url) {
        throw new APIerror(500, "Error while uploading avatar on cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    // Delete old avatar if it exists
    if (req.user.avatar) {
        try {
            const oldAvatarPublicId = req.user.avatar.split("/").pop().split(".")[0];
            await deleteFromCloudinary(oldAvatarPublicId);
        } catch (err) {
            console.error("Failed to delete old avatar from Cloudinary:", err.message);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, user, "Avatar changed successfully")
    );
});


const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path;

    if (!coverImageLocalPath) {
        throw new APIerror(404, "Cover Image file not found");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    // cleanup local file (non-blocking)
    try {
        await fs.promises.unlink(coverImageLocalPath);
    } catch (err) {
        console.warn("Failed to delete temp file:", err.message);
    }

    if (!coverImage?.url) {
        throw new APIerror(500, "Error while uploading Cover Image on Cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $set: { coverImage: coverImage.url } },
        { new: true }
    ).select("-password");

    // Delete old coverImage if it exists
    if (req.user.coverImage) {
        try {
            const oldCoverImagePublicId = req.user.coverImage.split("/").pop().split(".")[0];
            await deleteFromCloudinary(oldCoverImagePublicId);
        } catch (err) {
            console.error("Failed to delete old CoverImage from Cloudinary:", err.message);
        }
    }

    return res.status(200).json(
        new ApiResponse(200, user, "Cover Image updated successfully")
    );
});

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    //Get username or url from req.params
    const {username} = req.params

    if(!username?.trim()){
        throw new APIerror(400,"username is required")
    }

    const channel = await User.aggregate([
        {
            $match:{
                username:username?.toLowerCase()
            }
        },
        {
            $lookup:{
                from:"subscriptions",             //Subscription model -> changed to subscriptions as in db it is stored in plural
                localField:"_id",
                foreignField:"channel",
                as:"subscribers"
            }
        },
        {
            $lookup:{
                from:"subscriptions",
                localField:"_id",
                foreignField:"subscriber",
                as:"subscriptions"
            }
        },
        {
            $addFields:{
                subscribersCount:{
                    $size:"$subscribers"
                },
                channelsSubscribedToCount:{
                    $size:"$subscriptions"
                },
                isSubscribed: {
                    $cond: {
                        if: { $in: [ req.user?._id, "$subscribers.subscriber" ] },
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project:{
                fullname:1,
                username:1,
                subscribersCount:1,
                channelsSubscribedToCount:1,
                isSubscribed:1,
                avatar:1,
                coverImage:1,
                email:1,
                createdAt:1
            }
        }
    ])


    if(!channel?.length){
        throw new APIerror(404,"Channel not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        channel[0],
        "Channel profile fetched successfully"
    ))
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {
            $match:{
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"watchHistory",
                foreignField:"_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup:{
                            from:"users",
                            localField:"owner",
                            foreignField:"_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project:{
                                        fullname:1,
                                        username:1,
                                        avatar:1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user[0].watchHistory,
        "WatchHistory fetched successfully."
    ))
})



export {registerUser,
        loginUser,
        logoutUser,
        refreshAccessToken,
        changeCurrentPassword,
        getCurrentUser,
        updateAccount,
        updateUserAvatar,
        updateUserCoverImage,
        getUserChannelProfile,
        getWatchHistory
    };