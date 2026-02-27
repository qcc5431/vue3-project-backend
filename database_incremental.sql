-- ============================================
-- 增量更新脚本 - 添加笔记社交相关表
-- 执行前提：users表已存在
-- ============================================

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

-- ============================================
-- 更新users表（添加新字段）
-- ============================================
ALTER TABLE users 
  ADD COLUMN nickname VARCHAR(50) COMMENT '昵称' AFTER password,
  ADD COLUMN avatar VARCHAR(255) COMMENT '头像URL' AFTER nickname,
  ADD COLUMN bio VARCHAR(255) COMMENT '个人简介' AFTER avatar;

-- ============================================
-- 完成提示
-- ============================================
SELECT '数据库表创建完成！' as message;
SHOW TABLES;
