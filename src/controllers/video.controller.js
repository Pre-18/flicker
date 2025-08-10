import { asyncHandler } from "../utiles/asyncHandler";
import { ApiError } from "../utiles/ApiError";
import { ApiResponse } from "../utiles/ApiResponse";
import { uploadOnCloudinary } from "../utiles/fileUpload";
import { Video } from "../models/video.model";
import { User } from "../models/user.model";
import mongoose,{isValidObjectId} from "mongoose";
import { Playlist } from "../models/playlist.model";
import { authorizedOwner } from "./playlist.controller";

const addVideoToPlaylistUtility=asyncHandler(async (videoId,playlistId,req)=>{
    
  if (!videoId || !playlistId) {
    throw new ApiError(400, "video id or playlist id is not provided");
  }

  if (!isValidObjectId(videoId) || !isValidObjectId(playlistId)) {
    throw new ApiError(400, "invalid video Id or playlist Id");
  }

  const playlist = await Playlist.findById(playlistId);
  if (!playlist) {
    throw new ApiError(404, "playlist does not exist in DB");
  }

  // Authorization check
  if (!authorizedOwner(req.user, playlist.owner)) {
    throw new ApiError(401, "unauthorized access");
  }

  // Check if video exists
  const videoExists = await Video.exists({ _id: videoId });
  if (!videoExists) {
    throw new ApiError(404, "video does not exist");
  }

  // Avoid duplicates (use equals comparison for ObjectIds)
  if (playlist.videos.some((id) => id.equals(videoId))) {
    return { success: false, message: "Video already in playlist" };
  }

  const updatedPlaylist = await Playlist.findByIdAndUpdate(
    playlistId,
    { $push: { videos: videoId } },
    { new: true }
  );

  if (!updatedPlaylist) {
    throw new ApiError(500, "Failed to update playlist");
  }

  return { success: true, playlist: updatedPlaylist };

});

const publishVideo = asyncHandler(async (req, res, next) => {
  const { title, description, visibility } = req.body;

  // Parse playlistIds safely
  let playlistIds = [];
  try {
    playlistIds = JSON.parse(req.body.playlistIds || "[]");
  } catch {
    return next(new ApiError(400, "Invalid format for playlistIds"));
  }

  if (!title) {
    return next(new ApiError(400, "title cannot be empty"));
  }

  if (!req.files || !(req.files.videoFile?.length) || !(req.files.thumbnail?.length)) {
    return next(new ApiError(400, "please select a video and a thumbnail image to upload"));
  }

  const videoLocalPath = req.files.videoFile[0].path;
  const thumbnailLocalPath = req.files.thumbnail[0].path;

  let video, thumbnail;
  try {
    [video, thumbnail] = await Promise.all([
      uploadOnCloudinary(videoLocalPath),
      uploadOnCloudinary(thumbnailLocalPath),
    ]);
  } catch (err) {
    return next(new ApiError(500, "Error uploading video or thumbnail"));
  }

  if (!video) {
    return next(new ApiError(500, "something went wrong while uploading video"));
  }

  if (!thumbnail) {
    return next(new ApiError(500, "something went wrong while uploading thumbnail"));
  }

  const isPublished = visibility === "public";

  const videoDoc = await Video.create({
    title,
    description,
    videofile: video.url,  
    thumbnail: thumbnail.url,
    duration: video.duration,
    owner: req.user._id,
    isPublished,
  });

  if (!videoDoc) {
    return next(new ApiError(500, "something went wrong while saving video in database"));
  }

  // Add video to playlists - individually handle errors
  for (const playlistId of playlistIds) {
    try {
      await addVideoToPlaylistUtility(videoDoc._id, playlistId, req);
    } catch (err) {
      console.error(`Failed to add video to playlist ${playlistId}:`, err);
      
    }
  }

  return res
    .status(201)
    .json(new ApiResponse(201, videoDoc, "Video published successfully"));
});


const getVideoById = asyncHandler(async (req, res, next) => {
  const { videoId } = req.params;

  if (!videoId) throw new ApiError(400, "video id is missing");
  if (!isValidObjectId(videoId)) throw new ApiError(400, "invalid video id");

  // Increment views and check existence
  const viewUpdate = await Video.updateOne(
    { _id: videoId },
    { $inc: { views: 1 } }
  );
  if (viewUpdate.matchedCount === 0) {
    throw new ApiError(404, `video with id ${videoId} not found`);
  }

  const pipeline = [
    { $match: { _id: new mongoose.Types.ObjectId(videoId) } },
    {
      $lookup: {
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          { $project: { userName: 1, fullName: 1, avatar: 1 } }
        ]
      }
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes"
      }
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner._id",
        foreignField: "channel",
        as: "subscribers"
      }
    },
    {
      $addFields: {
        owner: { $first: "$owner" },
        likes: { $size: "$likes" },
        subscribers: { $size: "$subscribers" },
        isLiked: req.user ? {
          $anyElementTrue: {
            $map: {
              input: "$likes",
              as: "like",
              in: { $eq: ["$$like.likedBy", req.user._id] }
            }
          }
        } : false,
        isSubscribed: req.user ? {
          $anyElementTrue: {
            $map: {
              input: "$subscribers",
              as: "sub",
              in: { $eq: ["$$sub.subscriber", req.user._id] }
            }
          }
        } : false
      }
    }
  ];

  const videoAgg = await Video.aggregate(pipeline);
  if (!videoAgg.length) throw new ApiError(404, "Video not found after aggregation");

  // Update watch history in DB directly
  if (req.user) {
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { watchHistory: videoId },
      $push: { watchHistory: { $each: [videoId], $position: 0 } }
    });
  }

  res.status(200).json(
    new ApiResponse(200, videoAgg[0], `video with id ${videoId} fetched successfully`)
  );
});

export {
    publishVideo,
    getVideoById,

}