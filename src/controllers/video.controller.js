import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import ApiResponse from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  //get all the videos from req object(req.query)
  //then query into the db
  //stored in an array

  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;

  if (!userId) {
    throw new ApiError(400, "UserId is required");
  }

  const existedUser = await User.findById(userId);

  if (!existedUser) {
    throw new ApiError(404, "User not found");
  }

  const pageNumber = parseInt(page, 10);
  const limitNumber = parseInt(limit, 10);

  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(userId), //str to obj
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "videoOwner",
        as: "videos",
      },
    },
    {
      $unwind: { path: "$videos", preserveNullAndEmptyArrays: true },
    },
    {
      $match: {
        ...(query && { "videos.title": { $regex: query, $options: "i" } }),
      },
    },
    {
      $sort: {
        [`videos.${sortBy}`]: sortType == "asc" ? 1 : -1,
      },
    },
    {
      $skip: (pageNum - 1) * limitNum,
    },
    {
      $limit: limitNum,
    },
    {
      $group: {
        _id: "$_id",
        videos: { $push: "$videos" },
      },
    },
  ]);

  if (!user || user.length === 0) {
    return new ApiError(404, "No videos found");
  }

  const videos = user[0].videos;

  return res
    .status(200)
    .json(
      new ApiResponse(200, "Videos fetched successfully", {
        videos,
        currentPage: pageNum,
        totalVideos: videos.length,
      })
    );
});

const publishAVideo = asyncHandler(async (req, res) => {
  //get the video details from req.body
  //validate the video details
  //publish the video
  //store in db
  //return the response

  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    throw new ApiResponse(400, "Title and description are required");
  }

  if (!req.files?.videoFile || !req.files?.thumbNail) {
    throw new ApiResponse(400, "Video File and thumbnail is required");
  }

  let videoFileUrl;
  if (
    req.files &&
    Array.isArray(req.files.videoFile) &&
    req.videoFile.length > 0
  ) {
    videoFileUrl = req.files.videoFile[0].path;
  }

  if (!videoFileUrl) {
    throw new ApiError(400, "Video file is required");
  }

  let thumbNailUrl;
  if (
    req.files &&
    Array.isArray(req.files.thumbNail) &&
    req.thumbNail.length > 0
  ) {
    thumbNailUrl = req.files.thumbNailUrl[0].path;
  }

  if (!thumbNailUrl) {
    throw new ApiError(400, "ThumbNail file is required");
  }

  const uploadedVideoFile = await uploadOnCloudinary(videoFileUrl);
  const uploadedThumbNailUrl = await uploadOnCloudinary(thumbNailUrl);

  if (!uploadedVideoFile || !uploadedThumbNailUrl) {
    throw new ApiError(500, "Failed to upload video or thumbnail");
  }

  const video = await Video.create({
    title: title,
    description: description,
    videoFileUrl: uploadedVideoFile.url,
    thumbNailUrl: uploadedThumbNailUrl.url,
    duration: uploadedVideoFile.duration,
    onwer: req.user._id,
    isPublished: true,
    views: 0,
  });

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  //get the videoId from req.params
  //find that video from the db
  //return res
  const { videoId } = req.params;

  if (!videoId?.trim()) {
    //in these cases it will throw error //undefined //null //empty string //only whitespace
    throw new ApiError(400, "VideoId is required");
  }

  //alternate way
  //in these cases it will throw error //undefined //null //empty string //only whitespace
  // if (!videoId || !videoId.trim()) {
  //   throw new ApiError(400, "VideoId is required");
  // }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(400, "Video not found");
  }

  return res.status(200).json(200, video, "Video fetched successfully");
});

const updateVideo = asyncHandler(async (req, res) => {
  //get the videoId from req.params
  //check if the video exist or not
  //get the update data from req.body
  //find the video by id and update
  //return res

  const { videoId } = req.params;

  if (!videoId?.trim()) {
    return new ApiError(400, "Video file is required");
  }

  const { title, description } = req.body;

  if ([title, description].some((field) => field?.trim() === "")) {
    return new ApiError(400, "Title and description is required");
  }

  const isVideoExisted = await Video.findById(videoId);

  if (!isVideoExisted) {
    return new ApiError(404, "Video not found");
  }

  const thumbNailPath = req.file?.path; //through multer middleware

  if (!thumbNailPath) {
    return new ApiError(400, "ThumbNail file is required");
  }

  const uploadedThumbnailPath = await uploadOnCloudinary(thumbNailPath);

  if (!uploadedThumbnailPath) {
    return new ApiError(500, "Failed to upload thumbnail file");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, uploadedThumbnailPath, "Video update successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  //get that videoId to be deleted
  //find the video in the db
  //remove the video from the db
  //retun res
  
  const {videoId} = req.params

  if(!videoId?.trim()) {
    return new ApiError(400, "Video Id is required")
  }

  const isVideoExisted = await Video.findById(videoId)

  if(!isVideoExisted) {
    return new ApiError(404, "Video not found")
  }

  const video = await Video.findByIdAndDelete(videoId)

  if(!video) {
    return new ApiError(404, "Video not found")
  }

  return res
  .status(200)
  .json(new ApiResponse(200, video, "Video deleted successfully"))
});

const toggleVideoPublishStatus = asyncHandler(async (req, res) => {
  //get the video id from req.params
  //finds the video from the db
  //toggle the property isPublished in the video model
  //retun res

  const {videoId} = req.params

  if(!videoId?.trim()) {
    return new ApiError(400, "VideoId is required")
  }

  const video = await Video.findByIdAndDelete(videoId)

  if(!video) {
    return new ApiError(404, "Video not found")
  }

  video.isPublished = !video.isPublished
  await video.save()

  return res
  .status(200)
  .json(new ApiResponse(200, video, "Video toggle publish status updated successfully"))
})

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  toggleVideoPublishStatus
}