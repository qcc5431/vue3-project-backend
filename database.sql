-- ============================================
-- 项目数据库初始化脚本
-- 数据库名: vue3_backend
-- 字符集: utf8mb4
-- ============================================

-- 注意：数据库已通过以下命令手动创建，无需重复执行
-- CREATE DATABASE vue3_backend DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 如果需要切换数据库（手动执行时使用）
-- USE vue3_backend;

-- ============================================
-- 用户表
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  email VARCHAR(100) NOT NULL UNIQUE COMMENT '邮箱',
  password VARCHAR(255) NOT NULL COMMENT '密码（加密存储）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================
--
