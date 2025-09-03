import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Comment } from "../models/comment.model.js"
import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Like } from "../models/like.model.js";


const getVideoComments = asyncHandler(async (req, res) => {
    //get the video Id
    //apply pagination then write aggregation pipelines to fetch to video comments
    //return res
    
    const {videoId} = req.params

    if(!videoId?.trim()) {
        throw new ApiError(400, "Video Id is required")
    }

    const { page = 1, limit = 10 } = req.params

    let comments
    try {
        comments = await Comment.aggregate([
            {
                $match: {
                    video: mongoose.Types.createFromHexString(videoId)
                }
            },
            {
                $lookup: {
                    from: "users",
                    localField: "owner",
                    foreignField: "_id",
                    as: "details",
                    pipeline: [
                        {
                            $project: {
                                fullName: 1,
                                avatar: 1,
                                username: 1
                            }
                        }
                    ]
                    
                }
            },
            {
                $lookup: {
                    from: "likes",
                    localField: "_id",
                    foreignField: "comment",
                    as: "likes"
                }
            },
            {
                $addFields: {
                    details: {
                        $first: "$details"
                    },
                    likes: {$size: "$likes"}
                }
            },
            {
                $sort: (page - 1) * parentInt(limit)
            },
            {
                $limit: parseInt(limit)
            }
        ])
    } catch (error) {
        throw new ApiError(500, "Something went wrong while fetching comments")
    }

    if(comments.length === 0) {
        return res
        .status(200)
        .json(new ApiResponse(200, [], "No comments Found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments fetched successfully"))
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video

    //get the video Id, and user or owner from req.user._id
    //query into db and create a comment based on this userId
    //and create a comment on specific video

    const {videoId} = req.body

    if(!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Some of the deatils are not missing")
    }

    const {content} = req.body
    const userId = req.user?._id

    if(!userId) {
        throw new ApiError(400, "User Id is required")
    }

    const newComment = await Comment.create({
        content,
        userId,
        video: videoId
    })

    if(!newComment) {
        throw new ApiError(500, "Facing some issue with comment creation")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, newComment, "Comment a"))
})

const updateComment = asyncHandler(async (req, res) => {
    //get the comment Id from the req.params,
    //get the userId and the video Id as well
    //find that comment through quering into db
    //match the commet._id with the user id
    //if yes update the comment with the new content
    //return res

    const {commentId} = req.params
    const {content} = req.body


    if(!content || content.trim().length === 0) {
        throw new ApiError(400, "Please provide comment content")
    }

    if(!commentId) {
        throw new ApiError(400, "Comment Id not provided")
    }

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment Id")
    }

    const userId = req.user

    if(!userId) {
        throw new ApiError(400, "User Id not provided")
    }

    const existingContent = await Comment.findById(commentId).content

    if(existingContent === content) {
        throw new ApiError(400, "You cannot rewrite the same content")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if(!updateComment) {
        throw new ApiError(500, "Something went wrong in updating the comment")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updateComment, "Comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    //get the comment._id and the user._id as well 
    //find that comment through quering into db
    //match the commet._id with the user id
    //if yes delete the comment
    //return res

    const {commentId} = req.params

    if(!commentId) {
        throw new ApiError(400, "Comment Id is required")
    }

    const commentToBeDeleted = await Comment.findById(commentId)

    if(!commentToBeDeleted) {
        throw new ApiError(404, "Comment not found")
    }

    const deletedLikesAssociatedWithThisComment = await Like.deleteMany({
        comment: mongoose.Types.ObjectId(commentId)
    })

    console.log(deletedLikesAssociatedWithThisComment);
    

    return res
    .status(200)
    .json(new ApiResponse(200, {isDeleted: deletedLikesAssociatedWithThisComment.deletedCount > 0, deleteCount: deletedLikesAssociatedWithThisComment.deletedCount }, "Comment deleted successfully"))
})

