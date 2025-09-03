import { asyncHandler } from "../utils/asyncHandler.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {ApiError} from "../utils/ApiError.js"
import { isValidObjectId } from "mongoose"

const createTweet = asyncHandler(async (req, res) => {
    //get the content and the user._id first
    //query into db and create a new tweet with the given userid and content

    const {content} = req.body
    const ownerId = req.user?._id

    if(!content) {
        throw new ApiError(400, "Content should not be empty")
    }

    const newCreatedTweeet = await Tweet.create({content, owner: ownerId})

    if(!newCreatedTweeet) {
        throw new ApiError(500, "Something went wrong while creating a tweet")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, newCreatedTweeet, "Tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    //get the user._id first from the logged in user
    //query into db with find opr
    //return res

    const userId = req.user._id

    if(!userId) {
        throw new ApiError(400, "User Id is required")
    }

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user Id")
    }

    const allTweet = await Tweet.find({owner: userId}).sort({createdAt: -1})

    if(!allTweet) {
        throw new ApiError(500, "Something went wrong while fetching all tweets")
    }

    return res
    .status(200)
    .json(new ApiError(200, allTweet, "Fetched all tweet successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    //get the user._id first
    //and the tweet id of that user
    

    const userId = req.user?._id

    const {tweetId} = req.params

    const {content} = req.body

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if(!tweet.owner.equals(userId)) {
        throw new ApiError(403, "You can only update your own tweets")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if(!updateTweet) {
        throw new ApiError(500, "Something went wrong while updating the tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updateTweet, "Tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    //get the user._id and the tweet id
    //match that user id with the tweet id
    //if matched delet the tweet
    //retun res

    const {tweetId} = req.params

    const userId = req.user?._id

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiError(404, "Tweet not found")
    }

    if(!tweet.owner.equals(userId)) {
        throw new ApiError(403, "You can only deletes your own tweets")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet) {
        throw new ApiError(500, "Something went wrong while deleting tweet")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, deleteTweet, "Tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}


