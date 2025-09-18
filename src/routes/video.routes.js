import { Router } from "express";
import { 
    getAllVideos,
    deleteVideo,
    togglePublishStatus,
    getVideoById,
    uploadVideo,
    updateVideo
} from "../controllers/video.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

import multer from "multer";

const upload = multer({ dest: "uploads/" });

const router = Router();



// Public routes
router.get("/", getAllVideos);              // Get all videos with pagination, sorting, query
router.get("/:videoId", getVideoById);      // Get a single video by id (public)

// Protected routes
router.post("/", verifyJWT, upload.fields([
  { name: "videofile", maxCount: 1 },
  { name: "thumbnail", maxCount: 1 }
]), uploadVideo);   // Upload a new video

router.patch("/:videoId", verifyJWT, upload.fields([
  { name: "thumbnail", maxCount: 1 }
]), updateVideo);

router.delete("/:videoId", verifyJWT, deleteVideo); // Delete video (owner only)

router.patch("/:videoId/toggle", verifyJWT, togglePublishStatus); // Toggle publish/unpublish

export default router;
