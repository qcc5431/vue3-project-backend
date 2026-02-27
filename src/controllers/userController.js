const { pool } = require("../config/database");
const bcrypt = require("bcrypt");
const { generateToken, verifyToken } = require("../middleware/auth");

// 生成默认头像
const generateDefaultAvatar = (seed) => {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`;
};

// 获取当前用户信息
const getUserInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const [rows] = await pool.query(
      "SELECT id, username, email, nickname, avatar, bio, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    res.status(200).json({
      code: 200,
      message: "success",
      data: rows[0],
    });
  } catch (error) {
    console.error("获取用户信息失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取用户信息失败",
      error: error.message,
    });
  }
};

// 用户注册
const register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // 基础验证
    if (!username || !email || !password) {
      return res.status(400).json({
        code: 400,
        message: "用户名、邮箱和密码不能为空",
      });
    }

    // 检查用户名是否已存在
    const [existingUser] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username]
    );
    if (existingUser.length > 0) {
      return res.status(400).json({
        code: 400,
        message: "用户名已存在",
      });
    }

    // 检查邮箱是否已被注册
    const [existingEmail] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );
    if (existingEmail.length > 0) {
      return res.status(400).json({
        code: 400,
        message: "邮箱已被注册",
      });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 生成默认头像
    const avatar = generateDefaultAvatar(username);

    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, avatar) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, avatar]
    );

    res.status(200).json({
      code: 200,
      message: "注册成功",
      data: {
        id: result.insertId,
        username,
        email,
        avatar,
      },
    });
  } catch (error) {
    console.error("注册失败:", error);
    res.status(500).json({
      code: 500,
      message: "注册失败",
      error: error.message,
    });
  }
};

// 用户登录
const login = async (req, res) => {
  try {
    const { account, password } = req.body;

    // 基础验证
    if (!account || !password) {
      return res.status(400).json({
        code: 400,
        message: "用户名和密码不能为空",
      });
    }

    // 查询用户（支持用户名或邮箱登录）
    const [rows] = await pool.query(
      "SELECT id, username, email, password, nickname, avatar FROM users WHERE username = ? OR email = ?",
      [account, account]
    );

    if (rows.length === 0) {
      return res.status(401).json({
        code: 401,
        message: "用户名或密码错误",
      });
    }

    const user = rows[0];

    // 验证密码
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: "用户名或密码错误",
      });
    }

    // 生成 token
    const token = generateToken(user.id, user.username);

    res.status(200).json({
      code: 200,
      message: "登录成功",
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nickname: user.nickname || user.username,
          avatar: user.avatar || generateDefaultAvatar(user.username),
        },
      },
    });
  } catch (error) {
    console.error("登录失败:", error);
    res.status(500).json({
      code: 500,
      message: "登录失败",
      error: error.message,
    });
  }
};

// 用户退出登录
const logout = async (req, res) => {
  try {
    res.status(200).json({
      code: 200,
      message: "退出登录成功",
    });
  } catch (error) {
    console.error("退出登录失败:", error);
    res.status(500).json({
      code: 500,
      message: "退出登录失败",
      error: error.message,
    });
  }
};

// 修改密码
const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const userId = req.user.id;

    // 基础验证
    if (!oldPassword || !newPassword) {
      return res.status(400).json({
        code: 400,
        message: "旧密码和新密码不能为空",
      });
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      return res.status(400).json({
        code: 400,
        message: "新密码长度不能少于6位",
      });
    }

    // 查询用户当前密码
    const [rows] = await pool.query(
      "SELECT id, password FROM users WHERE id = ?",
      [userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    const user = rows[0];

    // 验证旧密码
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isOldPasswordValid) {
      return res.status(401).json({
        code: 401,
        message: "旧密码错误",
      });
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedNewPassword,
      userId,
    ]);

    res.status(200).json({
      code: 200,
      message: "密码修改成功",
    });
  } catch (error) {
    console.error("修改密码失败:", error);
    res.status(500).json({
      code: 500,
      message: "修改密码失败",
      error: error.message,
    });
  }
};

// 更新用户信息
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { nickname, bio, avatar } = req.body;

    await pool.query(
      "UPDATE users SET nickname = ?, bio = ?, avatar = ? WHERE id = ?",
      [nickname, bio, avatar, userId]
    );

    res.status(200).json({
      code: 200,
      message: "更新成功",
    });
  } catch (error) {
    console.error("更新用户信息失败:", error);
    res.status(500).json({
      code: 500,
      message: "更新用户信息失败",
      error: error.message,
    });
  }
};

// 获取所有用户（管理用）
const getAllUsers = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, nickname, avatar, bio, created_at FROM users"
    );
    res.status(200).json({
      code: 200,
      message: "success",
      data: rows,
    });
  } catch (error) {
    console.error("获取用户列表失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取用户列表失败",
      error: error.message,
    });
  }
};

// 根据ID获取用户
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT id, username, email, nickname, avatar, bio, created_at FROM users WHERE id = ?",
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({
        code: 404,
        message: "用户不存在",
      });
    }

    res.status(200).json({
      code: 200,
      message: "success",
      data: rows[0],
    });
  } catch (error) {
    console.error("获取用户失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取用户失败",
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
        code: 404,
        message: "用户不存在",
      });
    }

    res.status(200).json({
      code: 200,
      message: "删除成功",
    });
  } catch (error) {
    console.error("删除用户失败:", error);
    res.status(500).json({
      code: 500,
      message: "删除用户失败",
      error: error.message,
    });
  }
};

module.exports = {
  getUserInfo,
  register,
  login,
  logout,
  updatePassword,
  updateProfile,
  getAllUsers,
  getUserById,
  deleteUser,
};
