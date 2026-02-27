const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { verifyToken } = require("../middleware/auth");

// 公开路由（无需认证）
router.post("/register", userController.register);
router.post("/login", userController.login);

// 需要认证的路由
router.get("/info", verifyToken, userController.getUserInfo);
router.post("/logout", verifyToken, userController.logout);
router.put("/password", verifyToken, userController.updatePassword);
router.put("/profile", verifyToken, userController.updateProfile);

// 管理路由
router.get("/", userController.getAllUsers);
router.get("/:id", userController.getUserById);
router.delete("/:id", userController.deleteUser);

module.exports = router;
