const { pool } = require("../config/database");

// 获取笔记列表
const getNotes = async (req, res) => {
  try {
    const {
      page = 1,
      pageSize = 20,
      sortType = "recommend",
      authorId,
      isFollowing,
      isCollected,
    } = req.query;

    const userId = req.user?.id;
    const offset = (parseInt(page) - 1) * parseInt(pageSize);

    // 构建SQL
    let sql = `
      SELECT 
        n.id, n.title, n.content, n.cover_media, n.images,
        n.author_id, n.visibility, n.like_count, n.collect_count,
        n.comment_count, n.view_count, n.created_at, n.updated_at,
        u.username as author_name, u.avatar as author_avatar
      FROM notes n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.visibility = 'public'
    `;

    const params = [];

    // 指定作者
    if (authorId) {
      sql += " AND n.author_id = ?";
      params.push(authorId);
    }

    // 只看关注的人
    if (isFollowing === "true" && userId) {
      sql +=
        " AND n.author_id IN (SELECT following_id FROM follows WHERE follower_id = ?)";
      params.push(userId);
    }

    // 只看收藏的笔记
    if (isCollected === "true" && userId) {
      sql +=
        " AND n.id IN (SELECT note_id FROM note_collects WHERE user_id = ?)";
      params.push(userId);
    }

    // 排序
    if (sortType === "latest") {
      sql += " ORDER BY n.created_at DESC";
    } else if (sortType === "hot") {
      sql += " ORDER BY n.like_count DESC, n.view_count DESC";
    } else {
      // recommend - 综合排序
      sql +=
        " ORDER BY n.like_count * 2 + n.collect_count * 3 + n.view_count DESC, n.created_at DESC";
    }

    // 获取总数
    const countSql = sql.replace(
      /SELECT[\s\S]*?FROM/,
      "SELECT COUNT(*) as total FROM"
    );
    const [countRows] = await pool.query(countSql, params);
    const total = countRows[0].total;

    // 分页
    sql += " LIMIT ? OFFSET ?";
    params.push(parseInt(pageSize), offset);

    const [rows] = await pool.query(sql, params);

    // 处理数据
    const list = rows.map((row) => {
      // MySQL2 自动解析 JSON 字段，无需 JSON.parse
      let coverMedia = [];
      if (row.cover_media) {
        coverMedia = Array.isArray(row.cover_media)
          ? row.cover_media
          : typeof row.cover_media === "string"
          ? JSON.parse(row.cover_media)
          : [];
      }

      let images = [];
      if (row.images) {
        images = Array.isArray(row.images)
          ? row.images
          : typeof row.images === "string"
          ? JSON.parse(row.images)
          : [];
      }

      return {
        id: String(row.id),
        title: row.title,
        content: row.content,
        coverMedia: coverMedia.slice(0, 1), // 列表只返回第一张封面
        images,
        authorId: String(row.author_id),
        authorName: row.author_name,
        authorAvatar: row.author_avatar,
        visibility: row.visibility,
        likeCount: row.like_count,
        collectCount: row.collect_count,
        commentCount: row.comment_count,
        viewCount: row.view_count,
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
      };
    });

    // 如果用户已登录，查询点赞和收藏状态
    if (userId && list.length > 0) {
      const noteIds = list.map((n) => n.id);
      const [likedRows] = await pool.query(
        `SELECT note_id FROM note_likes WHERE user_id = ? AND note_id IN (?)`,
        [userId, noteIds]
      );
      const [collectedRows] = await pool.query(
        `SELECT note_id FROM note_collects WHERE user_id = ? AND note_id IN (?)`,
        [userId, noteIds]
      );

      const likedSet = new Set(likedRows.map((r) => String(r.note_id)));
      const collectedSet = new Set(collectedRows.map((r) => String(r.note_id)));

      list.forEach((note) => {
        note.isLiked = likedSet.has(note.id);
        note.isCollected = collectedSet.has(note.id);
      });
    } else {
      list.forEach((note) => {
        note.isLiked = false;
        note.isCollected = false;
      });
    }

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
    console.error("获取笔记列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取笔记列表失败",
      error: error.message,
    });
  }
};

// 获取笔记详情
const getNoteById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    // 更新浏览量
    await pool.query(
      "UPDATE notes SET view_count = view_count + 1 WHERE id = ?",
      [id]
    );

    const [rows] = await pool.query(
      `SELECT 
        n.*, 
        u.username as author_name, u.avatar as author_avatar
      FROM notes n
      LEFT JOIN users u ON n.author_id = u.id
      WHERE n.id = ?`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "笔记不存在",
      });
    }

    const row = rows[0];

    // MySQL2 自动解析 JSON 字段，无需 JSON.parse
    let coverMedia = [];
    if (row.cover_media) {
      coverMedia = Array.isArray(row.cover_media)
        ? row.cover_media
        : typeof row.cover_media === "string"
        ? JSON.parse(row.cover_media)
        : [];
    }

    let images = [];
    if (row.images) {
      images = Array.isArray(row.images)
        ? row.images
        : typeof row.images === "string"
        ? JSON.parse(row.images)
        : [];
    }

    const note = {
      id: String(row.id),
      title: row.title,
      content: row.content,
      coverMedia,
      images,
      authorId: String(row.author_id),
      authorName: row.author_name,
      authorAvatar: row.author_avatar,
      visibility: row.visibility,
      likeCount: row.like_count,
      collectCount: row.collect_count,
      commentCount: row.comment_count,
      viewCount: row.view_count,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };

    // 查询点赞和收藏状态
    if (userId) {
      const [likedRows] = await pool.query(
        "SELECT id FROM note_likes WHERE note_id = ? AND user_id = ?",
        [id, userId]
      );
      const [collectedRows] = await pool.query(
        "SELECT id FROM note_collects WHERE note_id = ? AND user_id = ?",
        [id, userId]
      );

      note.isLiked = likedRows.length > 0;
      note.isCollected = collectedRows.length > 0;
    } else {
      note.isLiked = false;
      note.isCollected = false;
    }

    res.status(200).json({
      code: 200,
      message: "success",
      data: note,
    });
  } catch (error) {
    console.error("获取笔记详情失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取笔记详情失败",
      error: error.message,
    });
  }
};

// 创建笔记
const createNote = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      title,
      content,
      coverMedia,
      images,
      visibility = "public",
    } = req.body;

    if (!title) {
      return res.status(400).json({
        code: 400,
        message: "标题不能为空",
      });
    }

    const [result] = await pool.query(
      `INSERT INTO notes (title, content, cover_media, images, author_id, visibility)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        title,
        content || "",
        JSON.stringify(coverMedia || []),
        JSON.stringify(images || []),
        userId,
        visibility,
      ]
    );

    res.status(200).json({
      code: 200,
      message: "创建成功",
      data: {
        id: String(result.insertId),
      },
    });
  } catch (error) {
    console.error("创建笔记失败:", error);
    res.status(500).json({
      code: 500,
      message: "创建笔记失败",
      error: error.message,
    });
  }
};

// 更新笔记
const updateNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { title, content, coverMedia, images, visibility } = req.body;

    // 检查笔记是否存在且属于当前用户
    const [rows] = await pool.query(
      "SELECT author_id FROM notes WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "笔记不存在",
      });
    }

    if (rows[0].author_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: "无权限修改此笔记",
      });
    }

    await pool.query(
      `UPDATE notes SET 
        title = ?, content = ?, cover_media = ?, images = ?, visibility = ?
       WHERE id = ?`,
      [
        title,
        content,
        JSON.stringify(coverMedia || []),
        JSON.stringify(images || []),
        visibility,
        id,
      ]
    );

    res.status(200).json({
      code: 200,
      message: "更新成功",
    });
  } catch (error) {
    console.error("更新笔记失败:", error);
    res.status(500).json({
      code: 500,
      message: "更新笔记失败",
      error: error.message,
    });
  }
};

// 删除笔记
const deleteNote = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查笔记是否存在且属于当前用户
    const [rows] = await pool.query(
      "SELECT author_id FROM notes WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "笔记不存在",
      });
    }

    if (rows[0].author_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: "无权限删除此笔记",
      });
    }

    await pool.query("DELETE FROM notes WHERE id = ?", [id]);

    res.status(200).json({
      code: 200,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除笔记失败:", error);
    res.status(500).json({
      code: 500,
      message: "删除笔记失败",
      error: error.message,
    });
  }
};

// 点赞/取消点赞
const toggleLike = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查笔记是否存在
    const [noteRows] = await pool.query("SELECT id FROM notes WHERE id = ?", [
      id,
    ]);

    if (noteRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "笔记不存在",
      });
    }

    // 检查是否已点赞
    const [likeRows] = await pool.query(
      "SELECT id FROM note_likes WHERE note_id = ? AND user_id = ?",
      [id, userId]
    );

    let isLiked, likeCount;

    if (likeRows.length > 0) {
      // 取消点赞
      await pool.query(
        "DELETE FROM note_likes WHERE note_id = ? AND user_id = ?",
        [id, userId]
      );
      await pool.query(
        "UPDATE notes SET like_count = like_count - 1 WHERE id = ?",
        [id]
      );
      isLiked = false;
    } else {
      // 点赞
      await pool.query(
        "INSERT INTO note_likes (note_id, user_id) VALUES (?, ?)",
        [id, userId]
      );
      await pool.query(
        "UPDATE notes SET like_count = like_count + 1 WHERE id = ?",
        [id]
      );
      isLiked = true;
    }

    // 获取最新点赞数
    const [countRows] = await pool.query(
      "SELECT like_count FROM notes WHERE id = ?",
      [id]
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
    console.error("点赞操作失败:", error);
    res.status(500).json({
      code: 500,
      message: "点赞操作失败",
      error: error.message,
    });
  }
};

// 收藏/取消收藏
const toggleCollect = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查笔记是否存在
    const [noteRows] = await pool.query("SELECT id FROM notes WHERE id = ?", [
      id,
    ]);

    if (noteRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "笔记不存在",
      });
    }

    // 检查是否已收藏
    const [collectRows] = await pool.query(
      "SELECT id FROM note_collects WHERE note_id = ? AND user_id = ?",
      [id, userId]
    );

    let isCollected, collectCount;

    if (collectRows.length > 0) {
      // 取消收藏
      await pool.query(
        "DELETE FROM note_collects WHERE note_id = ? AND user_id = ?",
        [id, userId]
      );
      await pool.query(
        "UPDATE notes SET collect_count = collect_count - 1 WHERE id = ?",
        [id]
      );
      isCollected = false;
    } else {
      // 收藏
      await pool.query(
        "INSERT INTO note_collects (note_id, user_id) VALUES (?, ?)",
        [id, userId]
      );
      await pool.query(
        "UPDATE notes SET collect_count = collect_count + 1 WHERE id = ?",
        [id]
      );
      isCollected = true;
    }

    // 获取最新收藏数
    const [countRows] = await pool.query(
      "SELECT collect_count FROM notes WHERE id = ?",
      [id]
    );
    collectCount = countRows[0].collect_count;

    res.status(200).json({
      code: 200,
      message: isCollected ? "收藏成功" : "取消收藏成功",
      data: {
        isCollected,
        collectCount,
      },
    });
  } catch (error) {
    console.error("收藏操作失败:", error);
    res.status(500).json({
      code: 500,
      message: "收藏操作失败",
      error: error.message,
    });
  }
};

module.exports = {
  getNotes,
  getNoteById,
  createNote,
  updateNote,
  deleteNote,
  toggleLike,
  toggleCollect,
};
