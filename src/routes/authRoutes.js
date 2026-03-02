const express = require("express");
const router = express.Router();
const { sendCode, phoneLogin } = require("../controllers/authController");

// POST /api/auth/send-code  - 发送手机验证码
router.post("/send-code", sendCode);

// POST /api/auth/phone-login - 验证码登录（手机号未注册时自动注册）
router.post("/phone-login", phoneLogin);

module.exports = router;
