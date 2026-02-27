/**
 * COS孤儿图片清理脚本
 *
 * 功能：扫描COS存储桶，对比数据库中的图片引用，删除未被引用的图片
 *
 * 使用方式：
 *   node src/scripts/cleanupOrphanImages.js        # 预览模式（不实际删除）
 *   node src/scripts/cleanupOrphanImages.js --exec # 执行删除
 *
 * 建议配置定时任务（crontab）：
 *   0 3 * * * cd /path/to/project && node src/scripts/cleanupOrphanImages.js --exec >> logs/cleanup.log 2>&1
 */

require("dotenv").config();
const COS = require("cos-nodejs-sdk-v5");
const { pool } = require("../config/database");

// COS配置
const BUCKET = process.env.COS_BUCKET || "web-front-1360774249";
const REGION = process.env.COS_REGION || "ap-beijing";
const ENV_PREFIX = process.env.NODE_ENV === "production" ? "prod" : "dev";

// 初始化COS客户端
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

// 是否执行删除（默认预览模式）
const isExecute = process.argv.includes("--exec");

/**
 * 获取COS上所有图片
 */
async function getAllCOSImages() {
  const allImages = [];
  let marker = undefined;

  do {
    const result = await new Promise((resolve, reject) => {
      cos.getBucket(
        {
          Bucket: BUCKET,
          Region: REGION,
          Prefix: `${ENV_PREFIX}/uploads/images/`,
          Marker: marker,
          MaxKeys: 1000,
        },
        (err, data) => {
          if (err) reject(err);
          else resolve(data);
        }
      );
    });

    if (result.Contents) {
      allImages.push(...result.Contents.map((item) => item.Key));
    }
    marker = result.NextMarker;
  } while (marker);

  return allImages;
}

/**
 * 从数据库获取所有被引用的图片URL
 */
async function getReferencedImages() {
  const referencedUrls = new Set();

  // 1. 从笔记表获取
  const [notes] = await pool.query(
    "SELECT cover_media, images FROM notes WHERE cover_media IS NOT NULL OR images IS NOT NULL"
  );

  notes.forEach((note) => {
    // 解析cover_media（MySQL2 自动解析 JSON 字段）
    if (note.cover_media) {
      const coverMedia = Array.isArray(note.cover_media)
        ? note.cover_media
        : typeof note.cover_media === "string"
        ? JSON.parse(note.cover_media)
        : [];
      coverMedia.forEach((item) => {
        if (item.url) referencedUrls.add(item.url);
      });
    }

    // 解析images（MySQL2 自动解析 JSON 字段）
    if (note.images) {
      const images = Array.isArray(note.images)
        ? note.images
        : typeof note.images === "string"
        ? JSON.parse(note.images)
        : [];
      images.forEach((url) => referencedUrls.add(url));
    }
  });

  // 2. 从用户表获取头像
  const [users] = await pool.query(
    "SELECT avatar FROM users WHERE avatar IS NOT NULL"
  );
  users.forEach((user) => {
    if (user.avatar) referencedUrls.add(user.avatar);
  });

  return referencedUrls;
}

/**
 * 从URL提取COS Key
 */
function extractKeyFromUrl(url) {
  if (!url) return null;
  const match = url.match(/\.myqcloud\.com\/(.+)/);
  return match ? match[1] : null;
}

/**
 * 主函数
 */
async function main() {
  console.log("=================================");
  console.log("🧹 COS孤儿图片清理脚本");
  console.log(`📦 存储桶: ${BUCKET}`);
  console.log(`🌍 环境: ${ENV_PREFIX}`);
  console.log(`🔧 模式: ${isExecute ? "执行删除" : "预览模式"}`);
  console.log("=================================\n");

  try {
    // 1. 获取COS上所有图片
    console.log("📂 正在扫描COS存储桶...");
    const cosImages = await getAllCOSImages();
    console.log(`   找到 ${cosImages.length} 张图片\n`);

    // 2. 获取数据库中引用的图片
    console.log("📊 正在查询数据库引用...");
    const referencedUrls = await getReferencedImages();
    const referencedKeys = new Set();
    referencedUrls.forEach((url) => {
      const key = extractKeyFromUrl(url);
      if (key) referencedKeys.add(key);
    });
    console.log(`   找到 ${referencedKeys.size} 个引用\n`);

    // 3. 找出孤儿图片
    const orphanImages = cosImages.filter((key) => !referencedKeys.has(key));
    console.log(`🗑️  发现 ${orphanImages.length} 张孤儿图片\n`);

    if (orphanImages.length === 0) {
      console.log("✅ 没有需要清理的图片");
      process.exit(0);
    }

    // 4. 显示前10张孤儿图片
    console.log("📋 孤儿图片列表（前10张）:");
    orphanImages.slice(0, 10).forEach((key, i) => {
      console.log(`   ${i + 1}. ${key}`);
    });
    if (orphanImages.length > 10) {
      console.log(`   ... 还有 ${orphanImages.length - 10} 张`);
    }
    console.log("");

    // 5. 执行删除或预览
    if (!isExecute) {
      console.log("⚠️  预览模式：未实际删除图片");
      console.log(
        "💡 如需执行删除，请运行: node src/scripts/cleanupOrphanImages.js --exec"
      );
    } else {
      console.log("🗑️  正在删除孤儿图片...");

      // 批量删除（每次最多1000个）
      for (let i = 0; i < orphanImages.length; i += 1000) {
        const batch = orphanImages.slice(i, i + 1000);
        await new Promise((resolve, reject) => {
          cos.deleteMultipleObject(
            {
              Bucket: BUCKET,
              Region: REGION,
              Objects: batch.map((key) => ({ Key: key })),
            },
            (err, data) => {
              if (err) reject(err);
              else resolve(data);
            }
          );
        });
        console.log(
          `   已删除 ${Math.min(i + 1000, orphanImages.length)} / ${
            orphanImages.length
          }`
        );
      }

      console.log("\n✅ 清理完成！");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ 执行失败:", error);
    process.exit(1);
  }
}

main();
