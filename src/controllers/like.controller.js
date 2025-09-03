import mongoose, { isValidObjectId } from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Like } from "../models/like.model.js"
import { ApiResponse } from "../utils/ApiResponse";
import { Comment } from "../models/comment.model.js";
import { Tweet } from "../models/tweet.model.js"

const toogleVideoLike = asyncHandler(async (req, res) => {
    //TODO: toggle like on video

    //get the channelId from the req.params
    //validate it
    //get the user._id form the req.user
    //check if the like already exists for that user and that video
    //if exists then remove it
    //if not exists then create it

    const {videoId} = req.params;

    if(!videoId?.trim()) {
        throw new ApiError(400, "Channel id is required")
    }

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const userId = req.user?._id

    if(!userId) {
        throw new ApiError(400, "User Id is required")
    }

    //check if the user has already liked the video

    const existedLike = await Like.findOne({
        video: videoId,
        likedBy: userId 
    })

    //if like exists, delete it
    if(existedLike) {
        await Like.findByIdAndDelete(existedLike._id)
        return res.status(200).json(new ApiResponse(200, {}, "Video unlike successfully"))
    }

    //if like does not exist, create it
    const like = await Like.create({
        video: videoId,
        likedBy: userId
    })

    if(!like) {
        throw new ApiError(500, "Failed to toggle like")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, like, "Video liked successfully"))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //get the videoId first from req.params
    //validation
    //get the user._id form req.user._id
    //query in db to check already liked comment
    //if yes then delete it
    //create a fresh one
    //return res
    //TODO: toggle like on comment

    const {commentId} = req.params

    if(!commentId?.trim()) {
        throw new ApiError(400, "Video Id is required")
    }

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }

    const userId = req.user?._id

    if(!userId) {
        throw new ApiError(400, "User Id is required")
    }

    const existedCommentLike = await Comment.findOne({
        comment: commentId,
        likedBy: userId
    })

    if(existedCommentLike) {
        await Comment.findByIdAndDelete(existedCommentLike._id)
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Comment unliked successfully"))
    }

    const commentLike =  await Comment.create({
        commentId: commentId,
        likedBy: userId
    })

    if(!commentLike) {
        throw new ApiError(500, "Failed to toggle like")
    }

    return res
    .status(200)
    .jons(new ApiResponse(200, commentLike, "Comment liked successfully"))


})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //get the videoId first from req.params
    //validation
    //get the user._id form req.user._id
    //query in db to check already liked comment
    //if yes then delete it
    //create a fresh one
    //return res
    //TODO: toggle like on tweet

    const {tweetId} = req.params

    if(!tweetId?.trim()) {
        throw new ApiError(400, "Tweet Id is required")
    }

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    const userId = req.user?._id

    if(!userId) {
        throw new ApiError(400, "User Id is required")
    }

    const existedTweetLike = await Tweet.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if(existedTweetLike) {
        await Comment.findByIdAndDelete(existedTweetLike._id)
        return res
        .status(200)
        .json(new ApiResponse(200, {}, "Tweet unliked successfully"))
    }

    const tweetLike =  await Tweet.create({
        tweet: tweetId,
        likedBy: userId
    })

    if(!tweetLike) {
        throw new ApiError(500, "Failed to toggle tweet")
    }

    return res
    .status(200)
    .jons(new ApiResponse(200, tweetLike, "Tweet liked successfully"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const userId = req.user?._id
    
    if(!userId) {
        throw new ApiError(400, "User Id is required")
    }

    const likedVideos = await Like.find({
        likedBy: userId,
        video: {$exists: true}
    }).populate("video", "_id title url")

    return res
    .status(200),
    json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))
})

export {
    toogleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}