import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.

  const channelId = req.user?.id; //object-> now a string channel id

  if (!channelId) {
    throw new ApiError(401, "Unauthorized user");
  }

  let videos;
  try {
    videos = await Video.find({
      videoOwner: mongoose.Types.ObjectId.createFromHexString(channelId),
    }); //here channelId is a string channel id need to convert this into an object id
  } catch (error) {
    throw new ApiError(500, "Internal Server Error - Error fetching videos");
  }

  const totalVideos = videos.length;
  let likes = 0;
  let views = 0;

  for (let i = 0; i < videos.length; i++) {
    likes += videos[i].likes || 0;
    views += videos[i].views || 0;
  }

  let subscribers;

  try {
    subscribers = await Subscription.aggregate([
      {
        $match: {
          channel: channelId,
        },
      },
    ]);
  } catch (error) {
    // console.log("Error", error)
    new ApiError(500, "Error fetching subscribers");
  }

  const totalSubscribers = subscribers.length;

  return res.status(200).json(
    new ApiResponse(200, {
      totalVideos,
      totalLikes: likes,
      totalViews: views,
      totalSubscribers,
    }),
    "Channel Stats fetched successfully"
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  //firstly get the logged in user's _id
  //matched the the videoOwner to the user._id will return the specific user
  // return all the videos of that user

  const userId = req.user?._id;

  if (!userId) {
    throw new ApiError(401, "Unauthorized user");
  }

  let videos;
  try {
    videos = await Video.aggregate([
      {
        $match: {
          videoOwner: new mongoose.Types.ObjectId(userId),
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "videoOwner",
          foreignField: "_id",
          as: "videoOwnerDetails",
        },
      },
      {
        $unwind: "$videoOwnerDetails",
      },
      {
        $lookup: {
          from: "likes",
          localField: "_id",
          foreignField: "video",
          as: "likesDetails",
        },
      },
      {
        $addFields: {
          likesCount: { $size: "$likesDetails" },
        },
      },
      {
        $project: {
          videoFile: 1,
          thumbNail: 1,
          title: 1,
          isPublished: 1,
          createdAt: 1,
          videoOwner: "$videoOwnerDetails",
          description: 1,
          likesCount: 1,
        },
      },
      {
        $group: {
          _id: null,
          totalLikes: { $sum: "$likesCount" }, //sum of all video's likes
          totalVideos: { $sum: 1 }, // count videos
          videos: {
            $push: {
              _id: "$_id",
              likesCount: "$likesCount",
              videoFile: "$videoFile",
              thumbNail: "$thumbNail",
              title: "$title",
              isPublished: "$isPublished",
              createdAt: "$createdAt",
              videoOwner: "$videoOwner",
              description: "$description",
            },
          },
        },
      },
    ]);
  } catch (error) {
    throw new ApiError(500, "Error fetching videos");
  }

  if (!videos || videos.length === 0) {
    throw new ApiError(404, "No videos uploaded");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videos[0], "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
