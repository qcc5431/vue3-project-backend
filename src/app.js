const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

// 创建Express应用实例
const app = express();

// 中间件配置
app.use(cors()); // 允许跨域
app.use(bodyParser.json({ limit: "50mb" })); // 解析JSON请求体，支持大文件
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" })); // 解析URL编码的请求体

// 请求日志中间件
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// 健康检查路由
app.get("/health", (req, res) => {
  res.status(200).json({
    code: 200,
    message: "Server is running",
    data: {
      status: "ok",
      timestamp: new Date().toISOString(),
    },
  });
});

// API路由
const userRoutes = require("./routes/userRoutes");
const noteRoutes = require("./routes/noteRoutes");
const socialRoutes = require("./routes/socialRoutes");
const folderRoutes = require("./routes/folderRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

app.use("/api/users", userRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/social", socialRoutes);
app.use("/api/folders", folderRoutes);
app.use("/api/upload", uploadRoutes);

// 404处理
app.use((req, res) => {
  res.status(404).json({
    code: 404,
    message: `Cannot ${req.method} ${req.url}`,
  });
});

// 全局错误处理中间件
app.use((err, req, res, next) => {
  console.error("Error:", err.stack);
  res.status(err.status || 500).json({
    code: err.status || 500,
    message: err.message || "Internal Server Error",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
