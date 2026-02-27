const jwt = require("jsonwebtoken");
require("dotenv").config();

// JWT 密钥(从环境变量获取)
const JWT_SECRET =
  process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

// 生成 JWT token
const generateToken = (userId, username) => {
  return jwt.sign(
    {
      id: userId,
      username: username,
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
    }
  );
};

// 验证 JWT token 中间件（必须认证）
const verifyToken = (req, res, next) => {
  try {
    // 从请求头获取 token
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        code: 401,
        message: "未提供认证token",
      });
    }

    // 提取 token (格式: "Bearer <token>")
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return res.status(401).json({
        code: 401,
        message: "token格式错误",
      });
    }

    // 验证 token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 将用户信息附加到请求对象
    req.user = {
      id: decoded.id,
      username: decoded.username,
    };

    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        code: 401,
        message: "无效的token",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        code: 401,
        message: "token已过期",
      });
    }

    return res.status(500).json({
      code: 500,
      message: "token验证失败",
      error: error.message,
    });
  }
};

// 可选认证中间件（有token则验证，无token则跳过）
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return next();
    }

    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : authHeader;

    if (!token) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = {
        id: decoded.id,
        username: decoded.username,
      };
    } catch (e) {
      // token无效，但不阻止请求
    }

    next();
  } catch (error) {
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  optionalAuth,
  JWT_SECRET,
};
