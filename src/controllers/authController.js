const { pool } = require("../config/database");
const { sendVerifyCode } = require("../utils/sms");
const { generateToken } = require("../middleware/auth");

// 生成6位随机数字验证码
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 校验国内11位手机号
function isValidPhone(phone) {
  return /^1[3-9]\d{9}$/.test(phone);
}

// ─── POST /api/auth/send-code ────────────────────────────────────────────────
const sendCode = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({
        code: 400,
        message: "手机号格式不正确，请输入11位有效手机号",
      });
    }

    // 60秒内是否重复发送（防刷）
    const [recent] = await pool.query(
      "SELECT id FROM sms_codes WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND) ORDER BY created_at DESC LIMIT 1",
      [phone]
    );
    if (recent.length > 0) {
      return res.status(429).json({
        code: 429,
        message: "发送太频繁，请60秒后重试",
      });
    }

    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟后过期

    // 将该手机号的旧验证码全部失效
    await pool.query(
      "UPDATE sms_codes SET used = 1 WHERE phone = ? AND used = 0",
      [phone]
    );

    // 写入新验证码
    await pool.query(
      "INSERT INTO sms_codes (phone, code, expires_at) VALUES (?, ?, ?)",
      [phone, code, expiresAt]
    );

    // 发送短信（mock 模式下打印到控制台）
    await sendVerifyCode(phone, code);

    res.status(200).json({
      code: 200,
      message: "验证码已发送，5分钟内有效",
      data: {
        code, // 直接返回验证码，前端可直接使用
      },
    });
  } catch (error) {
    console.error("发送验证码失败:", error);
    res.status(500).json({
      code: 500,
      message: "发送失败，请稍后重试",
      error: error.message,
    });
  }
};

// ─── POST /api/auth/phone-login ──────────────────────────────────────────────
const phoneLogin = async (req, res) => {
  try {
    const { phone, code } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return res.status(400).json({
        code: 400,
        message: "手机号格式不正确",
      });
    }

    if (!code || code.length !== 6) {
      return res.status(400).json({
        code: 400,
        message: "请输入6位验证码",
      });
    }

    // 查询最新一条未过期且未使用的验证码
    const [rows] = await pool.query(
      `SELECT * FROM sms_codes
       WHERE phone = ? AND used = 0 AND expires_at > NOW()
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );

    if (rows.length === 0) {
      return res.status(400).json({
        code: 400,
        message: "验证码已过期或不存在，请重新获取",
      });
    }

    if (rows[0].code !== code) {
      return res.status(400).json({
        code: 400,
        message: "验证码错误",
      });
    }

    // 标记验证码为已使用
    await pool.query("UPDATE sms_codes SET used = 1 WHERE id = ?", [
      rows[0].id,
    ]);

    // 查找或自动注册用户
    let [users] = await pool.query(
      "SELECT id, username, phone, nickname, avatar FROM users WHERE phone = ?",
      [phone]
    );

    let user;
    let isNewUser = false;

    if (users.length === 0) {
      // 手机号首次登录 → 自动注册
      const username = `用户${phone.slice(-4)}${Date.now()
        .toString()
        .slice(-4)}`;
      const [result] = await pool.query(
        "INSERT INTO users (username, phone) VALUES (?, ?)",
        [username, phone]
      );
      user = {
        id: result.insertId,
        username,
        phone,
        nickname: null,
        avatar: null,
      };
      isNewUser = true;
    } else {
      user = users[0];
    }

    const token = generateToken(user.id, user.username);

    res.status(200).json({
      code: 200,
      message: isNewUser ? "注册并登录成功" : "登录成功",
      data: {
        isNewUser,
        token,
        user: {
          id: user.id,
          username: user.username,
          phone: user.phone,
          nickname: user.nickname,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    console.error("手机登录失败:", error);
    res.status(500).json({
      code: 500,
      message: "登录失败，请稍后重试",
      error: error.message,
    });
  }
};

module.exports = { sendCode, phoneLogin };
