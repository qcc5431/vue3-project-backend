const { pool } = require("../config/database");

// 获取文件夹列表
const getFolders = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      `SELECT id, name, note_count, created_at, updated_at
       FROM folders
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    const list = rows.map((row) => ({
      id: String(row.id),
      name: row.name,
      noteCount: row.note_count,
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    }));

    res.status(200).json({
      code: 200,
      message: "success",
      data: list,
    });
  } catch (error) {
    console.error("获取文件夹列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取文件夹列表失败",
      error: error.message,
    });
  }
};

// 创建文件夹
const createFolder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: "文件夹名称不能为空",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO folders (name, user_id) VALUES (?, ?)",
      [name, userId]
    );

    res.status(200).json({
      code: 200,
      message: "创建成功",
      data: {
        id: String(result.insertId),
        name,
        noteCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error("创建文件夹失败:", error);
    res.status(500).json({
      code: 500,
      message: "创建文件夹失败",
      error: error.message,
    });
  }
};

// 更新文件夹
const updateFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({
        code: 400,
        message: "文件夹名称不能为空",
      });
    }

    // 检查文件夹是否存在且属于当前用户
    const [rows] = await pool.query(
      "SELECT user_id FROM folders WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文件夹不存在",
      });
    }

    if (rows[0].user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: "无权限修改此文件夹",
      });
    }

    await pool.query("UPDATE folders SET name = ? WHERE id = ?", [name, id]);

    res.status(200).json({
      code: 200,
      message: "更新成功",
    });
  } catch (error) {
    console.error("更新文件夹失败:", error);
    res.status(500).json({
      code: 500,
      message: "更新文件夹失败",
      error: error.message,
    });
  }
};

// 删除文件夹
const deleteFolder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 检查文件夹是否存在且属于当前用户
    const [rows] = await pool.query(
      "SELECT user_id FROM folders WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文件夹不存在",
      });
    }

    if (rows[0].user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: "无权限删除此文件夹",
      });
    }

    await pool.query("DELETE FROM folders WHERE id = ?", [id]);

    res.status(200).json({
      code: 200,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除文件夹失败:", error);
    res.status(500).json({
      code: 500,
      message: "删除文件夹失败",
      error: error.message,
    });
  }
};

// 添加笔记到文件夹
const addNoteToFolder = async (req, res) => {
  try {
    const { folderId, noteId } = req.params;
    const userId = req.user.id;

    // 检查文件夹是否存在且属于当前用户
    const [folderRows] = await pool.query(
      "SELECT user_id FROM folders WHERE id = ?",
      [folderId]
    );

    if (folderRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文件夹不存在",
      });
    }

    if (folderRows[0].user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: "无权限操作此文件夹",
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

    // 检查是否已添加
    const [existingRows] = await pool.query(
      "SELECT id FROM folder_notes WHERE folder_id = ? AND note_id = ?",
      [folderId, noteId]
    );

    if (existingRows.length > 0) {
      return res.status(400).json({
        code: 400,
        message: "笔记已在此文件夹中",
      });
    }

    // 添加关联
    await pool.query(
      "INSERT INTO folder_notes (folder_id, note_id) VALUES (?, ?)",
      [folderId, noteId]
    );

    // 更新笔记数量
    await pool.query(
      "UPDATE folders SET note_count = note_count + 1 WHERE id = ?",
      [folderId]
    );

    res.status(200).json({
      code: 200,
      message: "添加成功",
    });
  } catch (error) {
    console.error("添加笔记到文件夹失败:", error);
    res.status(500).json({
      code: 500,
      message: "添加笔记到文件夹失败",
      error: error.message,
    });
  }
};

// 从文件夹移除笔记
const removeNoteFromFolder = async (req, res) => {
  try {
    const { folderId, noteId } = req.params;
    const userId = req.user.id;

    // 检查文件夹是否存在且属于当前用户
    const [folderRows] = await pool.query(
      "SELECT user_id FROM folders WHERE id = ?",
      [folderId]
    );

    if (folderRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文件夹不存在",
      });
    }

    if (folderRows[0].user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: "无权限操作此文件夹",
      });
    }

    // 删除关联
    const [result] = await pool.query(
      "DELETE FROM folder_notes WHERE folder_id = ? AND note_id = ?",
      [folderId, noteId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        code: 404,
        message: "笔记不在此文件夹中",
      });
    }

    // 更新笔记数量
    await pool.query(
      "UPDATE folders SET note_count = GREATEST(note_count - 1, 0) WHERE id = ?",
      [folderId]
    );

    res.status(200).json({
      code: 200,
      message: "移除成功",
    });
  } catch (error) {
    console.error("从文件夹移除笔记失败:", error);
    res.status(500).json({
      code: 500,
      message: "从文件夹移除笔记失败",
      error: error.message,
    });
  }
};

// 获取文件夹内的笔记
const getFolderNotes = async (req, res) => {
  try {
    const { folderId } = req.params;
    const userId = req.user.id;

    // 检查文件夹是否存在且属于当前用户
    const [folderRows] = await pool.query(
      "SELECT user_id FROM folders WHERE id = ?",
      [folderId]
    );

    if (folderRows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "文件夹不存在",
      });
    }

    if (folderRows[0].user_id !== userId) {
      return res.status(403).json({
        code: 403,
        message: "无权限访问此文件夹",
      });
    }

    const [rows] = await pool.query(
      `SELECT 
        n.id, n.title, n.cover_media, n.like_count, n.collect_count, n.created_at
      FROM folder_notes fn
      LEFT JOIN notes n ON fn.note_id = n.id
      WHERE fn.folder_id = ?
      ORDER BY fn.created_at DESC`,
      [folderId]
    );

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

      return {
        id: String(row.id),
        title: row.title,
        coverMedia: coverMedia.slice(0, 1),
        likeCount: row.like_count,
        collectCount: row.collect_count,
        createdAt: row.created_at.toISOString(),
      };
    });

    res.status(200).json({
      code: 200,
      message: "success",
      data: list,
    });
  } catch (error) {
    console.error("获取文件夹笔记失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取文件夹笔记失败",
      error: error.message,
    });
  }
};

module.exports = {
  getFolders,
  createFolder,
  updateFolder,
  deleteFolder,
  addNoteToFolder,
  removeNoteFromFolder,
  getFolderNotes,
};
