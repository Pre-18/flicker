import {asyncHandler} from '../utiles/asyncHandler.js';
import jwt from 'jsonwebtoken';
import {ApiError} from '../utiles/ApiError.js';
import { User } from '../models/user.model.js';
export const verifyJWT = asyncHandler(async (req, _, next) => {
    try{const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");


    if (!token) {
        throw new ApiError(401, "Unauthorized request: No token provided");
    }
    
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user= await User.findById(decodedToken?._id).select("-password -refreshToken");
    
      if (!user) {
        throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
    next();  } 
    catch (error) {

        throw new ApiError(401,error?.message ||"Unauthorized request: Invalid token");
    }
});
