const express = require("express");
const router = express.Router();
const noteController = require("../controllers/noteController");
const { optionalAuth, verifyToken } = require("../middleware/auth");

// 公开路由（可选认证，用于判断点赞/收藏状态）
router.get("/", optionalAuth, noteController.getNotes);
router.get("/:id", optionalAuth, noteController.getNoteById);

// 需要认证的路由
router.post("/", verifyToken, noteController.createNote);
router.put("/:id", verifyToken, noteController.updateNote);
router.delete("/:id", verifyToken, noteController.deleteNote);
router.post("/:id/like", verifyToken, noteController.toggleLike);
router.post("/:id/collect", verifyToken, noteController.toggleCollect);

module.exports = router;
