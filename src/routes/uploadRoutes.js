const express = require("express");
const router = express.Router();
const uploadController = require("../controllers/uploadController");
const { verifyToken } = require("../middleware/auth");

// 上传图片
router.post(
  "/image",
  verifyToken,
  uploadController.imageUpload.single("file"),
  uploadController.uploadImage
);

// 上传视频
router.post(
  "/video",
  verifyToken,
  uploadController.videoUpload.single("file"),
  uploadController.uploadVideo
);

// 获取上传凭证
router.get("/credential", verifyToken, uploadController.getUploadCredential);

module.exports = router;
