const express = require("express");
const router = express.Router();
const socialController = require("../controllers/socialController");
const { verifyToken, optionalAuth } = require("../middleware/auth");

// 关注/取消关注
router.post("/follow", verifyToken, socialController.toggleFollow);

// 获取关注列表
router.get("/following", verifyToken, socialController.getFollowing);

// 获取粉丝列表
router.get("/followers", verifyToken, socialController.getFollowers);

// 获取评论列表（可选认证）
router.get("/comments", optionalAuth, socialController.getComments);

// 发表评论
router.post("/comments", verifyToken, socialController.createComment);

// 点赞评论
router.post("/comments/like", verifyToken, socialController.toggleCommentLike);

module.exports = router;
