import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import mongoose, { isValidObjectId } from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Playlist } from "../models/playlist.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    //get the name and description from req.body
    //create a playlist with the given data
    //return res

    const {name, description} = req.body

    if(!name || !description) {
        throw new ApiError(400, "Title and description are required")
    }

    const userId = req.user?._id

    const NewlyCreatedplaylist = await Playlist.create({
        name,
        description,
        owner: userId
    })

    if(!NewlyCreatedplaylist) {
        throw new ApiError(500, "Error while creating the playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, NewlyCreatedplaylist, "Playlist created successfully"))
})

const getUserPlaylist = asyncHandler(async (req, res) => {
    //get the user from req.user?._id
    //query into db and find all playlists
    //return res

    const {userId} = req.user?._id

    if(!userId) {
        throw new ApiError(401, "You must be logged in")
    }

    const playlists = await Playlist.findOne(userId)

    if(!playlists || playlists.length === 0) {
        throw new ApiError(404, "No playlist found for this user")
    }

    return ApiResponse
    .status(200)
    .json(new ApiResponse(200, playlists, "Playlists fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    //get the playlist id from req.params
    //query into db find all playlists based on this playlist id
    //retun res

    const {playlistId}= req.params

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    const playlistById = await Playlist.findById(playlistId).populate("videos")

    if(!playlistById) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlistById, "Playlists fetched successfully"))
})

const addVideoToAPlaylist = asyncHandler(async (req, res) => {
    //get the video Id as well the playlist id
    //set the video to the playlist
    //return res

    const {videoId, playlistId} = req.params

    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id or video Id")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {
                videos: new mongoose.Types.createFromHexString(videoId)
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    //get the video Id as well the playlist id
    //pull or delete this video from the playlist
    //return res

    const {videoId, playlistId} = req.params

    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id or video Id")
    }

    const updatedPlaylist = await Playlist.findByIdAndDelete(
        playlistId,
        {
            $pull: {
                videos: new mongoose.Types.createFromHexString(videoId)
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "Video delete from playlist successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    //get the playlist id
    //query into db and the playlist for a particular id
    //return res

    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid Playlist Id")
    }

    const playlistToBeDeleted = await Playlist.findByIdAndDelete(playlistId)

    if(!playlistToBeDeleted) {
        throw new ApiError(404, "Playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        playlistToBeDeleted,
        "Playlist deleted successfully"
    ))
})

const updatedPlaylist = asyncHandler(async (req, res) => {
    //get the playlist form req.params
    //and get the field that you want to update 
    //update it through quering into db
    //retun res

    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new: true
        }
    )

    if(!updatedPlaylist) {
        throw new ApiError(500, "Error while updating playlist")
    }

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        updatedPlaylist,
        "Playlist updated successfully"
    ))
})

export {
    createPlaylist,
    getPlaylistById,
    getUserPlaylist,
    addVideoToAPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatedPlaylist
}