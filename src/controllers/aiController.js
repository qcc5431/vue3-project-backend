const aiService = require("../services/aiService");

/**
 * AI控制器 - 处理AI相关请求
 */

// 优化文案
const optimizeContent = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: "内容不能为空",
      });
    }

    // 限制内容长度
    if (content.length > 10000) {
      return res.status(400).json({
        code: 400,
        message: "内容过长，请缩短后重试",
      });
    }

    const optimizedContent = await aiService.optimizeContent(content);

    res.status(200).json({
      code: 200,
      message: "success",
      data: {
        originalContent: content,
        optimizedContent,
      },
    });
  } catch (error) {
    console.error("优化文案失败:", error);
    res.status(500).json({
      code: 500,
      message: error.message || "AI服务暂时不可用",
    });
  }
};

// 生成标题建议
const generateTitles = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: "内容不能为空",
      });
    }

    const titles = await aiService.generateTitles(content);

    res.status(200).json({
      code: 200,
      message: "success",
      data: {
        titles,
      },
    });
  } catch (error) {
    console.error("生成标题失败:", error);
    res.status(500).json({
      code: 500,
      message: error.message || "AI服务暂时不可用",
    });
  }
};

// 扩展内容
const expandContent = async (req, res) => {
  try {
    const { content, topic } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({
        code: 400,
        message: "内容不能为空",
      });
    }

    // 限制内容长度
    if (content.length > 10000) {
      return res.status(400).json({
        code: 400,
        message: "内容过长，请缩短后重试",
      });
    }

    const expandedContent = await aiService.expandContent(content, topic);

    res.status(200).json({
      code: 200,
      message: "success",
      data: {
        originalContent: content,
        expandedContent,
      },
    });
  } catch (error) {
    console.error("扩展内容失败:", error);
    res.status(500).json({
      code: 500,
      message: error.message || "AI服务暂时不可用",
    });
  }
};

module.exports = {
  optimizeContent,
  generateTitles,
  expandContent,
};