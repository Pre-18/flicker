import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id 
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    }
    if (channelId === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }
    const channel = await User.findById(channelId)
    if (!channel) { 
        throw new ApiError(404, "Channel not found")
    }
    const subscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if (subscription) {
        // Unsubscribe
        await Subscription.deleteOne({ _id: subscription._id })
        return ApiResponse.success(res, "Unsubscribed successfully")
    }

    // Subscribe
    await Subscription.create({ subscriber: userId, channel: channelId })
    return new ApiResponse(201,"subscribed successfully")
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID")
    } 
    const channel = await User.findById(channelId)
    if (!channel) { 
        throw new ApiError(404, "Channel not found")
    }
    const subscribers = await Subscription.find({ channel: channelId })
    return new ApiResponse(200, "Fetched subscribers successfully", subscribers)
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID")
    }
    const subscriber = await User.findById(subscriberId)
    if (!subscriber) {
        throw new ApiError(404, "Subscriber not found")
    }
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
    const channels = await User.find({ _id: { $in: subscriptions.map(sub => sub.channel) } })
    return new ApiResponse(200, "Fetched subscribed channels successfully", channels)
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}