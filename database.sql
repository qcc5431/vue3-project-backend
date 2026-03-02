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
  email VARCHAR(100) DEFAULT NULL UNIQUE COMMENT '邮箱',
  password VARCHAR(255) DEFAULT NULL COMMENT '密码（加密存储）',
  phone VARCHAR(20) DEFAULT NULL UNIQUE COMMENT '手机号',
  nickname VARCHAR(50) COMMENT '昵称',
  avatar VARCHAR(255) COMMENT '头像URL',
  bio VARCHAR(255) COMMENT '个人简介',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- 如果 users 表已存在，手动执行以下 ALTER 语句：
-- ALTER TABLE users ADD COLUMN phone VARCHAR(20) DEFAULT NULL UNIQUE COMMENT '手机号' AFTER password;
-- ALTER TABLE users MODIFY COLUMN email VARCHAR(100) DEFAULT NULL UNIQUE COMMENT '邮箱';
-- ALTER TABLE users MODIFY COLUMN password VARCHAR(255) DEFAULT NULL COMMENT '密码（加密存储）';
-- ALTER TABLE users ADD INDEX idx_phone (phone);

-- ============================================
-- 短信验证码表
-- ============================================
CREATE TABLE IF NOT EXISTS sms_codes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  phone VARCHAR(20) NOT NULL COMMENT '手机号',
  code VARCHAR(10) NOT NULL COMMENT '验证码',
  expires_at TIMESTAMP NOT NULL COMMENT '过期时间',
  used TINYINT(1) DEFAULT 0 COMMENT '是否已使用 0-未使用 1-已使用',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='短信验证码表';

-- ============================================
-- 笔记表
-- ============================================
CREATE TABLE IF NOT EXISTS notes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '笔记ID',
  title VARCHAR(255) NOT NULL COMMENT '标题',
  content TEXT COMMENT 'Markdown内容',
  cover_media JSON COMMENT '封面媒体数组',
  images JSON COMMENT '文中图片URL列表',
  author_id INT NOT NULL COMMENT '作者ID',
  visibility ENUM('public', 'private') DEFAULT 'public' COMMENT '可见性',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  collect_count INT DEFAULT 0 COMMENT '收藏数',
  comment_count INT DEFAULT 0 COMMENT '评论数',
  view_count INT DEFAULT 0 COMMENT '浏览数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_author (author_id),
  INDEX idx_visibility (visibility),
  INDEX idx_created (created_at),
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='笔记表';

-- ============================================
-- 点赞记录表
-- ============================================
CREATE TABLE IF NOT EXISTS note_likes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  note_id INT NOT NULL COMMENT '笔记ID',
  user_id INT NOT NULL COMMENT '用户ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  UNIQUE KEY uk_note_user (note_id, user_id),
  INDEX idx_note (note_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='点赞记录表';

-- ============================================
-- 收藏记录表
-- ============================================
CREATE TABLE IF NOT EXISTS note_collects (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  note_id INT NOT NULL COMMENT '笔记ID',
  user_id INT NOT NULL COMMENT '用户ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  UNIQUE KEY uk_note_user (note_id, user_id),
  INDEX idx_note (note_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏记录表';

-- ============================================
-- 评论表
-- ============================================
CREATE TABLE IF NOT EXISTS comments (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '评论ID',
  note_id INT NOT NULL COMMENT '笔记ID',
  user_id INT NOT NULL COMMENT '评论用户ID',
  content VARCHAR(1000) NOT NULL COMMENT '评论内容',
  reply_to INT COMMENT '回复的评论ID',
  like_count INT DEFAULT 0 COMMENT '点赞数',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  INDEX idx_note (note_id),
  INDEX idx_user (user_id),
  INDEX idx_reply (reply_to),
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reply_to) REFERENCES comments(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论表';

-- ============================================
-- 关注关系表
-- ============================================
CREATE TABLE IF NOT EXISTS follows (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关系ID',
  follower_id INT NOT NULL COMMENT '关注者ID',
  following_id INT NOT NULL COMMENT '被关注者ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '关注时间',
  UNIQUE KEY uk_follower_following (follower_id, following_id),
  INDEX idx_follower (follower_id),
  INDEX idx_following (following_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (following_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='关注关系表';

-- ============================================
-- 文件夹表
-- ============================================
CREATE TABLE IF NOT EXISTS folders (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '文件夹ID',
  name VARCHAR(100) NOT NULL COMMENT '文件夹名称',
  user_id INT NOT NULL COMMENT '所属用户ID',
  note_count INT DEFAULT 0 COMMENT '笔记数量',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX idx_user (user_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件夹表';

-- ============================================
-- 文件夹-笔记关联表
-- ============================================
CREATE TABLE IF NOT EXISTS folder_notes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
  folder_id INT NOT NULL COMMENT '文件夹ID',
  note_id INT NOT NULL COMMENT '笔记ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '添加时间',
  UNIQUE KEY uk_folder_note (folder_id, note_id),
  INDEX idx_folder (folder_id),
  INDEX idx_note (note_id),
  FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE CASCADE,
  FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='文件夹-笔记关联表';

-- ============================================
-- 评论点赞表
-- ============================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT '记录ID',
  comment_id INT NOT NULL COMMENT '评论ID',
  user_id INT NOT NULL COMMENT '用户ID',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '点赞时间',
  UNIQUE KEY uk_comment_user (comment_id, user_id),
  INDEX idx_comment (comment_id),
  INDEX idx_user (user_id),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='评论点赞表';
