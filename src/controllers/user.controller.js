import { asyncHandler } from "../utiles/asyncHandler.js"
import {ApiError} from "../utiles/ApiError.js"
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utiles/fileUpload.js";
import {ApiResponse} from "../utiles/ApiRespopnse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

 const registerUser = asyncHandler(async (req, res) => {
    // Logic for registering a user
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation
    // return res
    const { fullName,username, email, password } = req.body;
    //console.log("email", email); 
    if (!fullName || !username || !email || !password) {
        throw new ApiError(400, "All fields are required");
    }
    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username }, { email }] });
    if (existingUser) {
        throw new ApiError(409, "User already exists");
    }
  //  console.log("req.files", req.files);
     // Handle avatar upload
     const avatarLocalPath = req.files?.avatar?.[0]?.path;
    //const avatarCloudPath = avatarLocalPath ? await uploadOnCloudinary(avatarLocalPath) : "";
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
       coverImageLocalPath = req.files.coverImage[0].path;
   }
   if( !avatarLocalPath ) {
        throw new ApiError(400, "Avatar image is required");
    }

    // Upload avatar to Cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if (!avatar) {
        throw new ApiError(400, "Avatar file is required")
    }
    const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url ,
        coverImage: coverImage?.url || "",
    });
    // Remove sensitive fields from the response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user");
    }
    return res.status(201).json(
        new ApiResponse(200, "User registered successfully", createdUser)
    );
});


 export { registerUser };