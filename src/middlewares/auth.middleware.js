import APIerror from "../utils/apiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.models.js";

export const verifyJWT = asyncHandler(async(req,res,next) => {
    try {
        // Step 1-> Accessing token (access token only here) -> check for this token
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ","")
    
        if(!token){
            throw new APIerror(404, "Unauthorized request")
        }
    
        // Step 2-> if token available then check it 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            throw new APIerror(404,"Invalid access token")
        }
    
        req.user = user;
        next()
    } catch (error) {
        throw new APIerror(401,error?.message || "Invalid authorized request")
    }
})