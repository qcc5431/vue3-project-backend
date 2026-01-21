require("dotenv").config();
const app = require("./app");
const { testConnection } = require("./config/database");

const PORT = process.env.PORT || 3000;

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();

    // 启动HTTP服务器
    app.listen(PORT, () => {
      console.log("=================================");
      console.log(`🚀 服务器已启动`);
      console.log(`📍 端口: ${PORT}`);
      console.log(`🌍 环境: ${process.env.NODE_ENV || "development"}`);
      console.log(`🔗 访问地址: http://localhost:${PORT}`);
      console.log(`💚 健康检查: http://localhost:${PORT}/health`);
      console.log("=================================");
    });
  } catch (error) {
    console.error("❌ 服务器启动失败:", error);
    process.exit(1);
  }
};

// 优雅关闭
process.on("SIGTERM", () => {
  console.log("⚠️  收到SIGTERM信号,正在关闭服务器...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("⚠️  收到SIGINT信号,正在关闭服务器...");
  process.exit(0);
});

startServer();
