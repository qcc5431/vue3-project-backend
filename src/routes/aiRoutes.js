const express = require("express");
const router = express.Router();
const aiController = require("../controllers/aiController");
const { verifyToken } = require("../middleware/auth");

// 所有AI接口都需要登录认证
router.post("/optimize-content", verifyToken, aiController.optimizeContent);
router.post("/generate-titles", verifyToken, aiController.generateTitles);
router.post("/expand-content", verifyToken, aiController.expandContent);

module.exports = router;