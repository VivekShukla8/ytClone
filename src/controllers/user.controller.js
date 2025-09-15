import { use } from "react";
import connectDB from "../db/index.js";
import APIerror from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import {User} from "../models/user.models.js"
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

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
    const existedUser = User.findOne({
        $or:[ { username }, { email }]
    })
    if(existedUser){
        throw new APIerror(409, "User with username or email is already registered")
    }

    // check for images availability
    const avatarLocalPath = req.files?.avatar[0]?.path         //accessing file-> without cloudinary
    const coverImageLocalPath = req.files?.coverImage[0]?.path 
    
    //check for avatar
    if(!avatarLocalPath){
        throw new APIerror(400,"Avatar image is required")
    }

    // if available then upload them to clodinary
    const avatar = await uploadToCloudinary(avatarLocalPath)
    const coverImg = await uploadToCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new APIerror(400,"Avatar image is required")
    }

    // create user object and then save it to db
    const user = await User.create({
        username:username.toLowerCase(),
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
    

    console.log("email:",email);
})

export {registerUser};