const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");

// 用户路由
router.get("/getUsers", userController.getAllUsers);
router.get("/getUserById/:id", userController.getUserById);
router.post("/register", userController.createUser);
router.put("/updateUser/:id", userController.updateUser);
router.delete("/deleteUser/:id", userController.deleteUser);
router.post("/login", userController.login);
router.post("/logout", userController.logout);
router.post("/updatePassword", userController.updatePassword);

module.exports = router;
