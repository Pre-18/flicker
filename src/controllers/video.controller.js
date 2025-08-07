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



export {
    publishVideo,

}