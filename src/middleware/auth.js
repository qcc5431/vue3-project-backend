const jwt = require("jsonwebtoken");
require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// 生成 JWT Token
const generateToken = (userId, username) => {
  return jwt.sign(
    { id: userId, username },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// 必须认证中间件（未登录则拒绝）
// 使用方式：router.get("/profile", verifyToken, controller.getProfile)
// 请求头格式：Authorization: Bearer <token>
const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({
      code: 401,
      message: "未提供认证 token",
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
    next();
  } catch (err) {
    const message =
      err.name === "TokenExpiredError" ? "token 已过期" : "无效的 token";
    return res.status(401).json({ code: 401, message });
  }
};

// 可选认证中间件（有 token 则验证并挂载用户，无 token 则直接放行）
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = { id: decoded.id, username: decoded.username };
  } catch (e) {
    // token 无效不阻断请求，req.user 保持 undefined
  }

  next();
};

module.exports = { generateToken, verifyToken, optionalAuth, JWT_SECRET };
