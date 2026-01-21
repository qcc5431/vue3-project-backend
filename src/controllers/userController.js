const { pool } = require("../config/database");

// 获取所有用户
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM users");
    res.status(200).json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    res.status(500).json({
      success: false,
      message: "获取用户列表失败",
      error: error.message,
    });
  }
};

// 根据ID获取用户
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    res.status(200).json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("获取用户失败:", error);
    res.status(500).json({
      success: false,
      message: "获取用户失败",
      error: error.message,
    });
  }
};

// 创建新用户
const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 基础验证
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "用户名、邮箱和密码不能为空",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, password]
    );

    res.status(201).json({
      success: true,
      message: "用户创建成功",
      data: {
        id: result.insertId,
        username,
        email,
      },
    });
  } catch (error) {
    console.error("创建用户失败:", error);
    res.status(500).json({
      success: false,
      message: "创建用户失败",
      error: error.message,
    });
  }
};

// 更新用户
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email } = req.body;

    const [result] = await pool.query(
      "UPDATE users SET username = ?, email = ? WHERE id = ?",
      [username, email, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    res.status(200).json({
      success: true,
      message: "用户更新成功",
    });
  } catch (error) {
    console.error("更新用户失败:", error);
    res.status(500).json({
      success: false,
      message: "更新用户失败",
      error: error.message,
    });
  }
};

// 删除用户
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.query("DELETE FROM users WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "用户不存在",
      });
    }

    res.status(200).json({
      success: true,
      message: "用户删除成功",
    });
  } catch (error) {
    console.error("删除用户失败:", error);
    res.status(500).json({
      success: false,
      message: "删除用户失败",
      error: error.message,
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
