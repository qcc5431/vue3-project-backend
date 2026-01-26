const mysql = require("mysql2/promise");
require("dotenv").config();

// 当前运行环境
const NODE_ENV = process.env.NODE_ENV || "development";

// 数据库配置
const dbConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
};

// 输出环境信息
console.log(
  `🔧 当前环境: ${NODE_ENV === "production" ? "生产环境" : "开发环境"}`
);
console.log(
  `🔗 数据库连接: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
);

// 创建数据库连接池
const pool = mysql.createPool({
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

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

module.exports = { pool, testConnection, dbConfig };
