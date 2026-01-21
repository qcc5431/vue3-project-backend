const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// 用户路由
router.get("/", userController.getAllUsers); // GET /api/users - 获取所有用户
router.get("/:id", userController.getUserById); // GET /api/users/:id - 获取单个用户
router.post("/", userController.createUser); // POST /api/users - 创建用户
router.put("/:id", userController.updateUser); // PUT /api/users/:id - 更新用户
router.delete("/:id", userController.deleteUser); // DELETE /api/users/:id - 删除用户

module.exports = router;
