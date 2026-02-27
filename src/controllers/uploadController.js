const multer = require("multer");
const COS = require("cos-nodejs-sdk-v5");
const sharp = require("sharp");
const path = require("path");

// 初始化腾讯云COS客户端
const cos = new COS({
  SecretId: process.env.COS_SECRET_ID,
  SecretKey: process.env.COS_SECRET_KEY,
});

// COS配置
const BUCKET = process.env.COS_BUCKET || "web-front-1360774249";
const REGION = process.env.COS_REGION || "ap-beijing";

// 配置multer（内存存储）
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 默认10MB
  },
  fileFilter: (req, file, cb) => {
    cb(null, true);
  },
});

// 图片上传配置
const imageUpload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的图片格式"), false);
    }
  },
});

// 视频上传配置
const videoUpload = multer({
  storage,
  limits: {
    fileSize: 500 * 1024 * 1024, // 500MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "video/mp4",
      "video/quicktime",
      "video/x-msvideo",
      "video/webm",
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("不支持的视频格式"), false);
    }
  },
});

// 生成文件名（根据环境区分目录）
const generateFileName = (type, ext) => {
  // 环境前缀：生产环境用 prod，其他用 dev
  const envPrefix = process.env.NODE_ENV === "production" ? "prod" : "dev";

  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
  const dayTime = `${String(now.getDate()).padStart(2, "0")}${String(
    now.getHours()
  ).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(
    now.getSeconds()
  ).padStart(2, "0")}`;
  const randomStr = Math.random().toString(36).substring(2, 8);
  return `${envPrefix}/uploads/${type}/${yearMonth}/${dayTime}_${randomStr}.${ext}`;
};

// 上传到COS（设置公有读权限）
const uploadToCOS = (key, buffer) => {
  return new Promise((resolve, reject) => {
    cos.putObject(
      {
        Bucket: BUCKET,
        Region: REGION,
        Key: key,
        Body: buffer,
        ACL: "public-read", // 设置文件为公有读
      },
      (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(`https://${BUCKET}.cos.${REGION}.myqcloud.com/${key}`);
        }
      }
    );
  });
};

// 上传图片
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: "请选择要上传的图片",
      });
    }

    const file = req.file;
    const type = req.body.type || "note"; // note 或 avatar

    // 获取图片尺寸
    const metadata = await sharp(file.buffer).metadata();
    const { width, height } = metadata;

    // 获取文件扩展名
    const ext = file.originalname.split(".").pop().toLowerCase() || "jpg";

    // 生成文件名
    const key = generateFileName(
      `images/${type === "avatar" ? "avatars" : "notes"}`,
      ext
    );

    // 上传到COS
    const url = await uploadToCOS(key, file.buffer);

    res.status(200).json({
      code: 200,
      message: "上传成功",
      data: {
        url,
        width,
        height,
      },
    });
  } catch (error) {
    console.error("上传图片失败:", error);
    res.status(500).json({
      code: 500,
      message: "上传图片失败",
      error: error.message,
    });
  }
};

// 上传视频
const uploadVideo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        code: 400,
        message: "请选择要上传的视频",
      });
    }

    const file = req.file;

    // 获取文件扩展名
    const ext = file.originalname.split(".").pop().toLowerCase() || "mp4";

    // 生成文件名
    const key = generateFileName("videos/notes", ext);

    // 上传到COS
    const url = await uploadToCOS(key, file.buffer);

    // 注意：视频元数据（宽高、时长）需要使用ffmpeg获取，这里简化处理
    // 如果需要获取视频元数据，需要安装 fluent-ffmpeg 并配置
    res.status(200).json({
      code: 200,
      message: "上传成功",
      data: {
        url,
        width: null,
        height: null,
        duration: null,
      },
    });
  } catch (error) {
    console.error("上传视频失败:", error);
    res.status(500).json({
      code: 500,
      message: "上传视频失败",
      error: error.message,
    });
  }
};

// 获取上传凭证（前端直传方案）
const getUploadCredential = async (req, res) => {
  try {
    const { type, ext } = req.query;

    if (!type || !ext) {
      return res.status(400).json({
        code: 400,
        message: "缺少必要参数",
      });
    }

    // 生成文件名
    const key = generateFileName(
      type === "image" ? "images/notes" : "videos/notes",
      ext
    );

    // 获取临时密钥
    cos.getBucket(
      {
        Bucket: BUCKET,
        Region: REGION,
      },
      (err, data) => {
        if (err) {
          return res.status(500).json({
            code: 500,
            message: "获取上传凭证失败",
            error: err.message,
          });
        }

        res.status(200).json({
          code: 200,
          message: "success",
          data: {
            uploadUrl: `https://${BUCKET}.cos.${REGION}.myqcloud.com`,
            key,
            // 注意：实际项目中需要使用STS临时密钥
            // 这里简化处理，实际使用时需要配置STS
          },
        });
      }
    );
  } catch (error) {
    console.error("获取上传凭证失败:", error);
    res.status(500).json({
      code: 500,
      message: "获取上传凭证失败",
      error: error.message,
    });
  }
};

module.exports = {
  upload,
  imageUpload,
  videoUpload,
  uploadImage,
  uploadVideo,
  getUploadCredential,
};
