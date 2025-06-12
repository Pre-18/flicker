import { asyncHandler } from "../utiles/asyncHandler.js"

const registerUser = asyncHandler(async (req, res) => {
    // Logic for registering a user
    res.status(200).json({ 
        message: "User registered successfully" });
 })


 export { registerUser };