import express from "express";
import {verifyJWT} from "../middlewares/auth.middleware.js";
import {
    addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
  fetchPlaylistWithVideoFlag,
  getUserPlaylistNames,
} from "../controllers/playlist.controller.js";

const router = express.Router();

router.use(verifyJWT);

router
  .route("/:playlistId")
  .get(getPlaylistById)
  .patch(updatePlaylist)
  .delete(deletePlaylist);

router.route("/playlists/:playlistId/videos/:videoId").post(addVideoToPlaylist);
router.route("/playlists/:playlistId/videos/:videoId").delete(removeVideoFromPlaylist);
router.route("/user/:userId/playlistNames").get(getUserPlaylistNames);
router.route("/user/:userId").get(getUserPlaylists);
router.route("/contains-video/:videoId").get(fetchPlaylistWithVideoFlag);

router.route("/").post(createPlaylist);

export default router;