import { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Subscription }  from "../models/subscription.model.js"
import { ApiResponse } from "../utils/ApiResponse.js";


const toggleSubscription = asyncHandler(async (req, res) => {
    //get the channel Id
    //get the user Id from req
    //check for the existing subscription, if yes then unsubscribe it and create one
    //return res

    const { channelId } = req.params

    if(!channelId?.trim()) {
        throw new ApiError(400, "Channel Id is required")
    }

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    const userId = req.user._id

    if(!user?.trim()) {
        throw new ApiError(400, "User Id is required")
    }

    if(userId.toString() == channelId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if(existingSubscription) {
        await Subscription.findByIdAndDelete(existingSubscription._id)
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Unsubsribed successfullly"))
    }

    await Subscription.create({subscriber: userId, channel: channelId})

    return res
    .status(200)
    .json(new ApiResponse(201, {}, "Subscribed successfully"))
    
})

// controller to return subscriber list of a channel
const getUserChannelSubscriber = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId?.trim()) {
        throw new ApiError(400, "ChannelId is required")
    }

    if(!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    const allMatchedSubscribersDoc = await Subscription.find({
        channel: channelId
    }).populate("subscriber", "_id name email")

    if(!allMatchedSubscribersDoc) {
        throw new ApiError(400, "Not found any subscribers with this channel Id")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, allMatchedSubscribersDoc, "Channel Subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    //get the channel id if first from the req.params
    //query in db to find all matched documents
    //return res

    const { subscriberId } = req.params

    if(!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid channel Id")
    }

    const allMatchedSubscribedChannelsDoc = await Subscription.find({subscriber: subscriberId}).populate("channel", "_id email name")

    if(!allMatchedSubscribedChannelsDoc || allMatchedSubscribedChannelsDoc.length === 0) {
        throw new ApiError(400, "Not found any subscriber with this channel")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, allMatchedSubscribedChannelsDoc, "Subscribed channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscriber,
    getSubscribedChannels
}