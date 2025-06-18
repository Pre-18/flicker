import { asyncHandler } from "../utiles/asyncHandler.js"
import {ApiError} from "../utiles/ApiError.js"
import {User} from "../models/user.model.js";
import {uploadOnCloudinary} from "../utiles/fileUpload.js";
import {ApiResponse} from "../utiles/ApiRespopnse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessandRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
        return { accessToken, refreshToken };
    } catch (error) {
        throw new ApiError(500, "Error generating tokens");
        
    }
    
};

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

  // Logic for logging in a user
  //user detail input and verification like email and password and username
  // check if user exists
// check if password is correct
// generate access token and refresh token
   

 const loginUser = asyncHandler(async (req, res) => {
    const { username,email, password } = req.body;
    if (!email && !password && !username) {
        throw new ApiError(400, "Email or username and password are required");
    }
    // Check if user exists
    const user = await User.findOne({ username, email });
    if (!user) {
        throw new ApiError(404, "User not found");
    }
    // Check if password is correct
    const isPasswordCorrect = await user.isPasswordCorrect(password);
    if (!isPasswordCorrect) {
        throw new ApiError(401, "Invalid credentials");
    }
    // Generate access token and refresh token

    const { accessToken, refreshToken } = await generateAccessandRefreshToken(user._id);
    // Remove sensitive fields from the response
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    );
    const options = {
        httpOnly: true,
        secure: true
    };
    return res.status(200).
    cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, "User logged in successfully", 
      { user: loggedInUser, accessToken, refreshToken })
    );
});

const logoutUser = asyncHandler(async (req, res) => {
 await User.findByIdAndUpdate(req.user._id,
     {
         $set: {refreshToken: undefined}
     },
    {
        new : true
    });
    const options = {
        httpOnly: true,
        secure: true
    };

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, "User logged out successfully"));
     
});

const refreshAccessToken = asyncHandler(async (req, res) => {
   const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;
   if (!incomingRefreshToken) {
       throw new ApiError(401, "Unauthorized request: No refresh token provided");
   } 
   try {
    const decodedToken = jwt.verify(
          incomingRefreshToken,
          process.env.REFRESH_TOKEN_SECRET);
 
       const user = await User.findById(decodedToken?._id);   
       if (!user) {
           throw new ApiError(401, " Invalid refresh token");
       }
       if( user.refreshToken !== incomingRefreshToken) {
           throw new ApiError(401, "refresh token is used or expired");
       }
       const options = {
           httpOnly: true,
           secure: true
       };
     const { accessToken, newRefreshToken } = await generateAccessandRefreshToken(user._id);
     return res.status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
         .json(
             new ApiResponse(200, "Access token refreshed successfully", 
             { accessToken, refreshToken: newRefreshToken })
         );
   } catch (error) {
       throw new ApiError(401, error?.message || " Invalid refresh token");
   }
});

 export { registerUser, loginUser,logoutUser, refreshAccessToken };