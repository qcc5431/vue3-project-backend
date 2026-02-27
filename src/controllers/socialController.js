const { pool } = require("../config/database");

// 关注/取消关注用户
const toggleFollow = async (req, res) => {
  try {
    const { userId: targetUserId } = req.body;
    const currentUserId = req.user.id;

    if (!targetUserId) {
      return res.status(400).json({
        code: 400,
        message: "用户ID不能为空",
      });
    }

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        code: 400,
        message: "不能关注自己",
      });
    }

    // 检查目标用户是否存在
    const [userRows] = await pool.query("SELECT id FROM users WHERE id = ?", [
      targetUserId,
    ]);

    if (userRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    // 检查是否已关注
    const [followRows] = await pool.query(
      "SELECT id FROM follows WHERE follower_id = ? AND following_id = ?",
      [currentUserId, targetUserId]
    );

    let isFollowing;

    if (followRows.length > 0) {
      // 取消关注
      await pool.query(
        "DELETE FROM follows WHERE follower_id = ? AND following_id = ?",
        [currentUserId, targetUserId]
      );
      isFollowing = false;
    } else {
      // 关注
      await pool.query(
        "INSERT INTO follows (follower_id, following_id) VALUES (?, ?)",
        [currentUserId, targetUserId]
      );
      isFollowing = true;
    }

    res.status(200).json({
      code: 200,
      message: isFollowing ? "关注成功" : "取消关注成功",
      data: {
        isFollowing,
      },
    });
  } catch (error) {
    console.error("关注操作失败:", error);
    res.status(500).json({
      code: 500,
      message: "关注操作失败",
      error: error.message,
    });
  }
};

// 获取关注列表
const getFollowing = async (req, res) => {
  try {
    const { userId, page = 1, pageSize = 10 } = req.query;
    const currentUserId = req.user.id;
    const targetUserId = userId || currentUserId;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    // 获取总数
    const [countRows] = await pool.query(
      "SELECT COUNT(*) as total FROM follows WHERE follower_id = ?",
      [targetUserId]
    );
    const total = countRows[0].total;

    // 获取关注列表
    const [rows] = await pool.query(
      `SELECT 
        u.id, u.username, u.nickname, u.avatar, u.bio,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COALESCE(SUM(like_count), 0) FROM notes WHERE author_id = u.id) as like_count
      FROM follows f
      LEFT JOIN users u ON f.following_id = u.id
      WHERE f.follower_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?`,
      [targetUserId, parseInt(pageSize), offset]
    );

    // 检查当前用户是否关注了这些用户
    const userIds = rows.map((r) => r.id);
    let followingSet = new Set();

    if (userIds.length > 0) {
      const [followingRows] = await pool.query(
        `SELECT following_id FROM follows WHERE follower_id = ? AND following_id IN (?)`,
        [currentUserId, userIds]
      );
      followingSet = new Set(followingRows.map((r) => r.following_id));
    }

    const list = rows.map((row) => ({
      id: String(row.id),
      username: row.username,
      nickname: row.nickname || row.username,
      avatar: row.avatar,
      bio: row.bio,
      followingCount: row.following_count,
      followersCount: row.followers_count,
      likeCount: row.like_count,
      isFollowing: followingSet.has(row.id),
    }));

    res.status(200).json({
      code: 200,
      message: "success",
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error("获取关注列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取关注列表失败",
      error: error.message,
    });
  }
};

// 获取粉丝列表
const getFollowers = async (req, res) => {
  try {
    const { userId, page = 1, pageSize = 10 } = req.query;
    const currentUserId = req.user.id;
    const targetUserId = userId || currentUserId;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    // 获取总数
    const [countRows] = await pool.query(
      "SELECT COUNT(*) as total FROM follows WHERE following_id = ?",
      [targetUserId]
    );
    const total = countRows[0].total;

    // 获取粉丝列表
    const [rows] = await pool.query(
      `SELECT 
        u.id, u.username, u.nickname, u.avatar, u.bio,
        (SELECT COUNT(*) FROM follows WHERE follower_id = u.id) as following_count,
        (SELECT COUNT(*) FROM follows WHERE following_id = u.id) as followers_count,
        (SELECT COALESCE(SUM(like_count), 0) FROM notes WHERE author_id = u.id) as like_count
      FROM follows f
      LEFT JOIN users u ON f.follower_id = u.id
      WHERE f.following_id = ?
      ORDER BY f.created_at DESC
      LIMIT ? OFFSET ?`,
      [targetUserId, parseInt(pageSize), offset]
    );

    // 检查当前用户是否关注了这些用户
    const userIds = rows.map((r) => r.id);
    let followingSet = new Set();

    if (userIds.length > 0) {
      const [followingRows] = await pool.query(
        `SELECT following_id FROM follows WHERE follower_id = ? AND following_id IN (?)`,
        [currentUserId, userIds]
      );
      followingSet = new Set(followingRows.map((r) => r.following_id));
    }

    const list = rows.map((row) => ({
      id: String(row.id),
      username: row.username,
      nickname: row.nickname || row.username,
      avatar: row.avatar,
      bio: row.bio,
      followingCount: row.following_count,
      followersCount: row.followers_count,
      likeCount: row.like_count,
      isFollowing: followingSet.has(row.id),
    }));

    res.status(200).json({
      code: 200,
      message: "success",
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error("获取粉丝列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取粉丝列表失败",
      error: error.message,
    });
  }
};

// 获取评论列表
const getComments = async (req, res) => {
  try {
    const { noteId, page = 1, pageSize = 10 } = req.query;
    const userId = req.user?.id;

    if (!noteId) {
      return res.status(400).json({
        code: 400,
        message: "笔记ID不能为空",
      });
    }

    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    // 获取总数
    const [countRows] = await pool.query(
      "SELECT COUNT(*) as total FROM comments WHERE note_id = ?",
      [noteId]
    );
    const total = countRows[0].total;

    // 获取评论列表
    const [rows] = await pool.query(
      `SELECT 
        c.id, c.note_id, c.user_id, c.content, c.like_count, c.reply_to, c.created_at,
        u.username, u.avatar as user_avatar,
        ru.username as reply_to_user
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      LEFT JOIN comments rc ON c.reply_to = rc.id
      LEFT JOIN users ru ON rc.user_id = ru.id
      WHERE c.note_id = ?
      ORDER BY c.created_at DESC
      LIMIT ? OFFSET ?`,
      [noteId, parseInt(pageSize), offset]
    );

    // 获取点赞状态
    let likedSet = new Set();
    if (userId && rows.length > 0) {
      const commentIds = rows.map((r) => r.id);
      const [likedRows] = await pool.query(
        `SELECT comment_id FROM comment_likes WHERE user_id = ? AND comment_id IN (?)`,
        [userId, commentIds]
      );
      likedSet = new Set(likedRows.map((r) => r.comment_id));
    }

    const list = rows.map((row) => ({
      id: String(row.id),
      noteId: String(row.note_id),
      userId: String(row.user_id),
      username: row.username,
      userAvatar: row.user_avatar,
      content: row.content,
      likeCount: row.like_count,
      isLiked: likedSet.has(row.id),
      replyTo: row.reply_to ? String(row.reply_to) : null,
      replyToUser: row.reply_to_user,
      createdAt: row.created_at.toISOString(),
    }));

    res.status(200).json({
      code: 200,
      message: "success",
      data: {
        list,
        total,
        page: parseInt(page),
        pageSize: parseInt(pageSize),
      },
    });
  } catch (error) {
    console.error("获取评论列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取评论列表失败",
      error: error.message,
    });
  }
};

// 发表评论
const createComment = async (req, res) => {
  try {
    const { noteId, content, replyTo } = req.body;
    const userId = req.user.id;

    if (!noteId || !content) {
      return res.status(400).json({
        code: 400,
        message: "笔记ID和评论内容不能为空",
      });
    }

    // 检查笔记是否存在
    const [noteRows] = await pool.query("SELECT id FROM notes WHERE id = ?", [
      noteId,
    ]);

    if (noteRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "笔记不存在",
      });
    }

    // 插入评论
    const [result] = await pool.query(
      "INSERT INTO comments (note_id, user_id, content, reply_to) VALUES (?, ?, ?, ?)",
      [noteId, userId, content, replyTo || null]
    );

    // 更新评论数
    await pool.query(
      "UPDATE notes SET comment_count = comment_count + 1 WHERE id = ?",
      [noteId]
    );

    res.status(200).json({
      code: 200,
      message: "评论成功",
      data: {
        id: String(result.insertId),
      },
    });
  } catch (error) {
    console.error("发表评论失败:", error);
    res.status(500).json({
      code: 500,
      message: "发表评论失败",
      error: error.message,
    });
  }
};

// 点赞评论
const toggleCommentLike = async (req, res) => {
  try {
    const { commentId } = req.body;
    const userId = req.user.id;

    if (!commentId) {
      return res.status(400).json({
        code: 400,
        message: "评论ID不能为空",
      });
    }

    // 检查评论是否存在
    const [commentRows] = await pool.query(
      "SELECT id FROM comments WHERE id = ?",
      [commentId]
    );

    if (commentRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "评论不存在",
      });
    }

    // 检查是否已点赞
    const [likeRows] = await pool.query(
      "SELECT id FROM comment_likes WHERE comment_id = ? AND user_id = ?",
      [commentId, userId]
    );

    let isLiked, likeCount;

    if (likeRows.length > 0) {
      // 取消点赞
      await pool.query(
        "DELETE FROM comment_likes WHERE comment_id = ? AND user_id = ?",
        [commentId, userId]
      );
      await pool.query(
        "UPDATE comments SET like_count = like_count - 1 WHERE id = ?",
        [commentId]
      );
      isLiked = false;
    } else {
      // 点赞
      await pool.query(
        "INSERT INTO comment_likes (comment_id, user_id) VALUES (?, ?)",
        [commentId, userId]
      );
      await pool.query(
        "UPDATE comments SET like_count = like_count + 1 WHERE id = ?",
        [commentId]
      );
      isLiked = true;
    }

    // 获取最新点赞数
    const [countRows] = await pool.query(
      "SELECT like_count FROM comments WHERE id = ?",
      [commentId]
    );
    likeCount = countRows[0].like_count;

    res.status(200).json({
      code: 200,
      message: isLiked ? "点赞成功" : "取消点赞成功",
      data: {
        isLiked,
        likeCount,
      },
    });
  } catch (error) {
    console.error("点赞评论失败:", error);
    res.status(500).json({
      code: 500,
      message: "点赞评论失败",
      error: error.message,
    });
  }
};

module.exports = {
  toggleFollow,
  getFollowing,
  getFollowers,
  getComments,
  createComment,
  toggleCommentLike,
};
