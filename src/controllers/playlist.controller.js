import { ApiError } from "../utiles/ApiError";
import { ApiResponse } from "../utiles/ApiResponse";
import { asyncHandler } from "../utiles/asyncHandler";
import {Playlist} from "../models/playlist.model"
import {Video} from "../models/video.model"
import mongoose ,{isValidObjectId, mongo} from "mongoose";
import { application } from "express";

export function authorizedOwner(reqUser, resourceOwnerId) {
    if (!reqUser || !reqUser._id || !resourceOwnerId) return false;
    return reqUser._id.toString() === resourceOwnerId.toString();
}

const createPlaylist  = asyncHandler(async (req,res,next) => {
    const {title , description} = req.body;
    if(!title || !description) {
        return next(new ApiError(400,"name and description are required"));
    }

    const createdPlaylist = await Playlist.create({
        title,
        description,
        owner: req.user._id,
    });
    
    if(!createdPlaylist){
        return next(
            new ApiError(500,"some error occurred while creating the playlist")
        )
    }
    res
    .status(201)
    .json(
        new ApiResponse(201, createdPlaylist , "playlist created successfully")
    );

});

const getUserPlaylists = asyncHandler( async( req, res , next) => {
    const {userID} = req.params;

    if(!userID){
        return next(new ApiError(400, "user ID not found"));
    } 

    if(!isValidObjectId(userID)){
        return next(new ApiError(401,"Invaild user ID"));
    }

    if(!authorizedOwner(req.user,userID)){
        return next(new ApiError(401, "unauthorized access "));
    }

    const pipeline = [
        {
            $match : {
                owner : new mongoose.Types.ObjectId(userID),
            },
        },
        {
            $unwind : {
                path : "$videos",
                preserveNullAndEmptyArrays: true,
            },
        },
        {
            $lookup:{
                from:"videos",
                localField: "videos",
                foreignField: "_id",
                as : "videoDetails",
            },
        },
        {
            $addFields:{
                videoDetails:{$ifNull :["$videoDetails",[]]},
            },
        },
       
        {
            $group: {
                _id : "$_id",
                title: { $first : "$title"},
                description : { $first : "$description"},
                owner : { $first : "$owner"},
                videos : {
                    $push : "$videoDetails", 
                },
                updatedAt: {$first: "$updatedAt"}
            }
        },
        {
            $sort:{
                updatedAt:-1,
            }
        },
        {
            $project: {
                title:1,
                description:1,
                videos:1,
                updatedAt:1
            }
        }
    ];

    const userPlaylists = await Playlist.aggregate(pipeline)

        //  const userPlaylists = await Playlist.find({ owner: userID })
        // .populate("videos")
        // .sort({ updatedAt: -1 });


    res
    .status
    .json(
        new ApiResponse(200, userPlaylists, "user playlists fetched successfully")
    )
});

const getUserPlaylistNames = asyncHandler(async(req,res,next) => {
    const {userId} = req.params;
    
    if(!userId){
        return next(new ApiError(400, "user ID is missing"));
    }
    
    if(!isValidObjectId(userId)){
        return next(new ApiError(400,"Invalid user Id"))
    }

    if(!authorizedOwner(req.user,userId)){
        return next(new ApiError(401, "unauthorized access "));
    }
   
    const pipeline= [
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $project: {
                _id:1,
                title:1
            }
        }
    ];

    const userPlaylists = await Playlist.aggregate(pipeline);

    res
    .status(200)
    .json(
        new ApiResponse(200,
            userPlaylists,
            "user playlist names fetched successfully")
    )

});

const getPlaylistById = asyncHandler(async (req,res,next) => {
    const {playlistId} =req.params;

    if(!playlistId){
        return next(new ApiError(400,"Playlist Id is missing "))
    }
    
    if(!isValidObjectId(playlistId)){
        return next(new ApiError(400,"Playlist Id is invalid "))
    }

    const pipeline =  [
        {
            $match: {
            _id: new mongoose.Types.ObjectId(playlistId),
                  },
        },
        {
            $lookup : {
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videoDetails"
            }
        },
        {
            $addFields:{
                videos:{
                    $ifNull:["$videos",[]],
                },
                videoDetails:{
                    $ifNull:["$videoDetails",[]]
                }
            }
        },
        {
            $unwind:{
                path: "$videoDetails",
                preserveNullAndEmptyArrays:true,
            },
        },
       {     
        $lookup:{
              
              from:"users",
              localField:"videoDetails.owner",
              foreignField:"_id",
              as:"ownerDetails"
            }
        } ,
        {
            $addFields:{
                "videoDetails.owner":{
                    $arrayElemAt:["$ownerDetails",0],

                }
            }
        },
         {
      $group: {
        _id: "$_id", 
        title: { $first: "$title" },
        description: { $first: "$description" },
        owner: { $first: "$owner" },
        updatedAt: { $first: "$updatedAt" },
        videos: {
          $push: {
            $cond: {
              if: { $ne: ["$videoDetails", null] }, 
              then: "$videoDetails", 
              else: "$$REMOVE", 
            },
          },
        },
      },
    },
    {
      $project: {
        title: 1,
        description: 1,
        owner: 1,
        updatedAt: 1,
        videos: {
          $cond: {
            if: { $eq: [{ $size: "$videos" }, 0] }, 
            then: [],
            else: "$videos", 
          },
        },
      },
    },
            
    ]
      
    const playlist=await Playlist.aggregate(pipeline);
    
    
  if (!playlist.length) {
    return next(new ApiError(404, "Playlist doesn't exist in DB"));
  }

  // Authorization: Is the requesting user the owner?
  if (!authorizedOwner(req.user, playlist[0].owner)) {
    return next(
      new ApiError(401, "Unauthorized request, you don't own this playlist")
    );
  }

  res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"));

});

  const addVideoToPlaylist = asyncHandler(async (req, res, next) => {
    const {playlistId,videoId} = req.params;

    if(!videoId || !playlistId){
        return next(new ApiError(400,"video id or playlist id is not provided"));
    }

    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        return next(new ApiError(400,"Invalid video Id or playlist id"))
    }

    const playlist= await Playlist.findById(playlistId);

    if(!playlist){
        return next(new ApiError(400,"Playlist does not exist"))
    }

    if(!authorizedOwner(req.user,playlist.owner)){
        return next(new ApiError(401,"unauthorized access"));
        }
    
    if(playlist.videos.includes(videoId)){
        return next(new ApiError(400,"Video is already the part of this playlist"))
    }

    const video= await Video.findOne({_id:videoId});

    if(!video){
        return next(new ApiError(400,"video does not exist in the database"))
    }

    if(!video.isPublished){
        return next(new ApiError(400, 
            "Please publish the video first and then add to this playlist"))
    }
 

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlist,{
            $push:{videos:videoId}
        },
        {
            new: true
        }
    );

    res
    .status(200)
    .json(
        new ApiResponse(200,updatedPlaylist,"video addded successfully to the playlist")
    );

 
  })

   const removeVideoFromPlaylist = asyncHandler(async (req,res,next)=>{
   
    const {videoId,playlistId} = req.params;

     if(!videoId || !playlistId){
        return next(new ApiError(400,"video id or playlist id is not provided"));
    }

    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        return next(new ApiError(400,"Invalid video Id or playlist id"))
    }

    const playlist= await Playlist.findById(playlistId);

    if(!playlist){
        return next(new ApiError(400,"Playlist does not exist"))
    }

    if(!authorizedOwner(req.user,playlist.owner)){
        return next(new ApiError(401,"unauthorized access"));
    }

      if (!playlist.videos.some(v => v.toString() === videoId)) {
        return next(new ApiError(400, "Video is not part of this playlist"));
    }

    const updatedPlaylist= await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull:{
                videos: videoId
            }
        },
        {
            new:true
        }
    );

    res
    .status(200)
    .json(
        new ApiResponse(200,updatedPlaylist,"Video removed from playlist successfully")
    );

   })

   const updatePlaylist= asyncHandler(async (req,res,next)=>{
   
    const {playlistId} = req.params;
    const {name,description} = req.body;

    if (!playlistId) {
    return next(new ApiError(400, "Playlist Id is missing"));
    }

    if (!isValidObjectId(playlistId)) {
    return next(new ApiError(400, "Invalid playlist Id"));
    }

    const playlist=await Playlist.findById(playlistId);

    if(!playlist){
         return next(new ApiError(400, "Playlist doesn't exist in DB"));
    }
 
    
    if(!authorizedOwner(req.user,playlist.owner)){
        return next(new ApiError(401,"unauthorized access"));
    }

    if(!(name || description)){
        return next(new ApiError(400,"Please provide at least one field to update"))
    }

  const updateData = {};
    if (name) updateData.title = name;
    if (description) updateData.description = description;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        updateData,
        { new: true }
    );


    if(!updatedPlaylist){
        return next(
            new ApiError(500,"something went wrong while updating playlist")
        );
    }

    res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedPlaylist,
            "playlist details updated successfully"
        )
    );

   });


   const deletePlaylist = asyncHandler(async (req,res,next)=>{
    const {playlistId}= req.params;
    
     if (!playlistId) {
    return next(new ApiError(400, "Playlist Id is missing"));
    }

    if (!isValidObjectId(playlistId)) {
    return next(new ApiError(400, "Invalid playlist Id"));
    }

    const playlist=await Playlist.findById(playlistId);

    if(!playlist){
         return next(new ApiError(404, "Playlist doesn't exist in DB"));
    }
 
    
    if(!authorizedOwner(req.user,playlist.owner)){
        return next(new ApiError(401,"unauthorized access"));
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId);

    if(!deletedPlaylist){
        return next(new ApiError(500,"something went wrong while deleting playlist"))
    }

    console.log(deletedPlaylist);

    res
    .status(200)
    .json(
        new ApiResponse(200,{},"playlist deleted successfully")
    );

   });


export{
    getPlaylistById,
    createPlaylist,
    getUserPlaylistNames,
    getUserPlaylists,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    updatePlaylist,
    deletePlaylist,

};
