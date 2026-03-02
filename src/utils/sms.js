require("dotenv").config();

/**
 * SMS_MODE 可选值：
 *   mock    - 模拟模式，验证码打印到控制台（默认，开发调试用）
 *   tencent - 腾讯云短信（需安装: npm install tencentcloud-sdk-nodejs-sms）
 *   smsbao  - 短信宝（无额外依赖，使用内置 https 模块）
 */
const SMS_MODE = process.env.SMS_MODE || "mock";

/**
 * 发送短信验证码
 * @param {string} phone - 手机号（11位，不含 +86）
 * @param {string} code  - 验证码
 * @returns {Promise<{ success: boolean, mode: string }>}
 */
async function sendVerifyCode(phone, code) {
  switch (SMS_MODE) {
    case "mock":
      return sendMock(phone, code);
    case "tencent":
      return sendViaTencent(phone, code);
    case "smsbao":
      return sendViaSmsbao(phone, code);
    default:
      throw new Error(`未知的 SMS_MODE: ${SMS_MODE}，请检查 .env 配置`);
  }
}

// ─── 模拟模式（开发调试） ────────────────────────────────────────────────────
function sendMock(phone, code) {
  console.log("─".repeat(50));
  console.log(`📱 [SMS MOCK] 手机号: ${phone}`);
  console.log(`🔑 [SMS MOCK] 验证码: ${code}`);
  console.log(`⏰ [SMS MOCK] 时间:   ${new Date().toLocaleTimeString()}`);
  console.log("─".repeat(50));
  return Promise.resolve({ success: true, mode: "mock" });
}

// ─── 腾讯云短信 ──────────────────────────────────────────────────────────────
// 使用前请先安装依赖: npm install tencentcloud-sdk-nodejs-sms
// 并在 .env 中配置以下变量：
//   TENCENT_SECRET_ID     - 腾讯云 SecretId
//   TENCENT_SECRET_KEY    - 腾讯云 SecretKey
//   TENCENT_SMS_APP_ID    - 短信应用 SDK AppID（非腾讯云账号 AppID）
//   TENCENT_SMS_SIGN      - 短信签名内容（如：您的应用名称）
//   TENCENT_SMS_TEMPLATE_ID - 短信模板 ID（模板示例：您的验证码为{1}，{2}分钟内有效）
async function sendViaTencent(phone, code) {
  const tencentcloud = require("tencentcloud-sdk-nodejs-sms");
  const SmsClient = tencentcloud.sms.v20210111.Client;

  const client = new SmsClient({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID,
      secretKey: process.env.TENCENT_SECRET_KEY,
    },
    region: "ap-guangzhou", // 按需修改：ap-beijing / ap-shanghai / ap-guangzhou
  });

  const params = {
    PhoneNumberSet: [`+86${phone}`],
    SmsSdkAppId: process.env.TENCENT_SMS_APP_ID,
    SignName: process.env.TENCENT_SMS_SIGN,
    TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID,
    TemplateParamSet: [code, "5"], // 参数1: 验证码，参数2: 有效分钟数
  };

  const result = await client.SendSms(params);
  const status = result.SendStatusSet?.[0];

  if (status?.Code !== "Ok") {
    throw new Error(`腾讯云短信发送失败: ${status?.Code} - ${status?.Message}`);
  }

  console.log(`✅ 腾讯云短信发送成功 -> ${phone}`);
  return { success: true, mode: "tencent" };
}

// ─── 短信宝 ──────────────────────────────────────────────────────────────────
// 无需额外安装依赖，使用 Node.js 内置 https 模块
// 官网注册: https://www.smsbao.com
// 并在 .env 中配置以下变量：
//   SMSBAO_USERNAME - 短信宝账号（手机号）
//   SMSBAO_PASSWORD - 短信宝密码（明文，内部会做 MD5 处理）
//   SMSBAO_SIGN     - 短信签名（如：【你的应用名】），需与平台申请一致
async function sendViaSmsbao(phone, code) {
  const crypto = require("crypto");
  const https = require("https");
  const querystring = require("querystring");

  const username = process.env.SMSBAO_USERNAME;
  const password = crypto
    .createHash("md5")
    .update(process.env.SMSBAO_PASSWORD)
    .digest("hex");
  const sign = process.env.SMSBAO_SIGN || "【您的应用】";
  const content = `${sign}您的验证码是${code}，5分钟内有效，请勿泄露。`;

  const params = querystring.stringify({
    u: username,
    p: password,
    m: phone,
    c: content,
  });

  const url = `https://www.smsbao.com/sms?${params}`;

  const codeMap = {
    0: "发送成功",
    30: "密码错误",
    40: "账号不存在",
    41: "余额不足",
    43: "IP 限制",
    50: "内容含敏感词",
    51: "手机号错误",
  };

  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          const trimmed = data.trim();
          if (trimmed === "0") {
            console.log(`✅ 短信宝发送成功 -> ${phone}`);
            resolve({ success: true, mode: "smsbao" });
          } else {
            reject(
              new Error(
                `短信宝发送失败: ${codeMap[trimmed] || `未知错误码 ${trimmed}`}`
              )
            );
          }
        });
      })
      .on("error", reject);
  });
}

module.exports = { sendVerifyCode };
