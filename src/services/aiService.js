const axios = require("axios");

// 获取配置（每次调用时读取）
const getConfig = () => {
  const url = process.env.DASHSCOPE_URL;
  const key = process.env.DASHSCOPE_API_KEY;
  console.log("AI服务配置:", { url, keyExists: !!key });
  return { url, key };
};

/**
 * AI服务封装 - deepseek
 */
const aiService = {
  /**
   * 优化旅行笔记文案
   * @param {string} content - 原始内容
   * @returns {Promise<string>} - 优化后的内容
   */
  async optimizeContent(content) {
    if (!content || content.trim().length === 0) {
      throw new Error("内容不能为空");
    }

    const { url, key } = getConfig();

    try {
      const response = await axios.post(
        url,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "你是一位专业的旅行内容编辑，擅长优化旅行笔记内容，使其更加生动、专业、吸引人。保持原文的核心信息和真实感受，优化语言表达和结构。",
            },
            {
              role: "user",
              content: `请优化以下旅行笔记内容，保持原文核心信息和真实感受，使表达更加流畅生动：

${content}

要求：
1. 保持原文的主要内容和情感基调
2. 优化语言表达，使其更加流畅自然
3. 可以适当调整段落结构
4. 直接输出优化后的内容，不要解释`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("AI优化文案失败:", error.message);
      if (error.response) {
        console.error("API响应错误:", error.response.data);
      }
      throw new Error("AI服务暂时不可用，请稍后重试");
    }
  },

  /**
   * 根据内容生成标题建议
   * @param {string} content - 笔记内容
   * @returns {Promise<string[]>} - 标题建议列表
   */
  async generateTitles(content) {
    if (!content || content.trim().length === 0) {
      throw new Error("内容不能为空");
    }

    const { url, key } = getConfig();

    try {
      const response = await axios.post(
        url,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "你是一位旅行内容运营专家，擅长为旅行笔记创作吸引人的标题。标题要简洁有力，能激发读者的阅读兴趣。",
            },
            {
              role: "user",
              content: `根据以下旅行笔记内容，生成5个吸引人的标题建议。

内容摘要：
${content.substring(0, 1000)}

要求：
1. 标题简洁有力，不超过20个字
2. 能吸引读者点击
3. 突出旅行目的地的特色或独特体验
4. 风格多样：可以是攻略型、体验型、感受型等

请直接以JSON数组格式返回标题，例如：["标题1", "标题2", "标题3", "标题4", "标题5"]
只返回JSON数组，不要有其他内容。`,
            },
          ],
          temperature: 0.8,
          max_tokens: 500,
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      const result = response.data.choices[0].message.content;

      // 尝试解析JSON
      try {
        // 提取JSON数组（处理可能的markdown代码块）
        let jsonStr = result;
        const jsonMatch = result.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          jsonStr = jsonMatch[0];
        }
        const titles = JSON.parse(jsonStr);
        if (Array.isArray(titles)) {
          return titles.slice(0, 5);
        }
      } catch (parseError) {
        console.error("解析标题JSON失败:", parseError);
      }

      // 如果解析失败，尝试按行分割
      const lines = result
        .split("\n")
        .map((line) => line.replace(/^[\d.、\-\*]+\s*/, "").trim())
        .filter((line) => line.length > 0 && line.length < 50);
      return lines.slice(0, 5);
    } catch (error) {
      console.error("AI生成标题失败:", error.message);
      if (error.response) {
        console.error("API响应错误:", error.response.data);
      }
      throw new Error("AI服务暂时不可用，请稍后重试");
    }
  },

  /**
   * 扩展笔记内容
   * @param {string} content - 原始内容
   * @param {string} topic - 扩展主题
   * @returns {Promise<string>} - 扩展后的内容
   */
  async expandContent(content, topic = "") {
    if (!content || content.trim().length === 0) {
      throw new Error("内容不能为空");
    }

    const { url, key } = getConfig();
    const topicPrompt = topic ? `，主题围绕"${topic}"` : "";

    try {
      const response = await axios.post(
        url,
        {
          model: "deepseek-chat",
          messages: [
            {
              role: "system",
              content:
                "你是一位旅行内容创作专家，擅长丰富和扩展旅行笔记内容，添加更多细节和实用信息。",
            },
            {
              role: "user",
              content: `请扩展以下旅行笔记内容${topicPrompt}，添加更多细节描述、实用建议或个人感受：

${content}

要求：
1. 保持原文风格和基调
2. 添加有价值的细节信息
3. 可以补充交通、住宿、美食等实用信息
4. 直接输出扩展后的内容，不要解释`,
            },
          ],
          temperature: 0.7,
          max_tokens: 4096,
        },
        {
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
          },
          timeout: 30000,
        },
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error("AI扩展内容失败:", error.message);
      if (error.response) {
        console.error("API响应错误:", error.response.data);
      }
      throw new Error("AI服务暂时不可用，请稍后重试");
    }
  },
};

module.exports = aiService;
