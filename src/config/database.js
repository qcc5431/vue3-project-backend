const mysql = require("mysql2/promise");
require("dotenv").config();

// 判断当前环境
const isProduction = process.env.NODE_ENV === "production";

// 数据库配置（根据环境自动切换）
const dbConfig = {
  // 生产环境：服务器本地连接
  // 开发环境：连接服务器远程数据库
  host: isProduction ? "localhost" : process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "test",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

console.log(`🔧 当前环境: ${isProduction ? "生产环境" : "开发环境"}`);
console.log(
  `🔗 数据库连接: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
);

// 创建数据库连接池
const pool = mysql.createPool(dbConfig);

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log("✅ 数据库连接成功");
    connection.release();
  } catch (error) {
    console.error("❌ 数据库连接失败:", error.message);
    process.exit(1);
  }
};

module.exports = { pool, testConnection };
