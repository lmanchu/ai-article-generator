#!/usr/bin/env node

/**
 * Article Generator
 * 使用 Lman 的寫作風格生成科技新聞評論文章
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * 載入 Lman 寫作風格 Persona
 */
function loadPersona() {
  try {
    const personaPath = config.PATHS.persona;
    const personaData = fs.readFileSync(personaPath, 'utf-8');
    return JSON.parse(personaData);
  } catch (error) {
    console.error('❌ 無法載入 Persona 檔案:', error.message);
    return null;
  }
}

/**
 * 抓取新聞內容摘要
 * (使用簡單的 curl，實際應用可整合 WebFetch)
 */
async function fetchNewsContent(url) {
  try {
    console.log('📖 正在讀取新聞內容...');

    // 使用 curl 抓取網頁內容
    const htmlCmd = `curl -s -L '${url}' | head -c 50000`;
    const html = execSync(htmlCmd, { encoding: 'utf-8', timeout: 10000 });

    // 簡單提取文字內容 (移除 HTML 標籤)
    const text = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 取前 2000 字作為摘要
    const summary = text.substring(0, 2000);

    console.log('✅ 新聞內容讀取完成\n');
    return summary;

  } catch (error) {
    console.error('⚠️  無法讀取新聞內容，將僅使用標題生成:', error.message);
    return null;
  }
}

/**
 * 建立文章生成 Prompt
 */
function buildArticlePrompt(newsItem, newsContent, persona) {
  const { twitter_curator_style, signature_phrases, topic_evolution } = persona;

  // 隨機選擇開場、強調、結尾用語
  const openingHooks = config.ARTICLE_CONFIG.opening_hooks;
  const emphasisPhrases = config.ARTICLE_CONFIG.emphasis_phrases;
  const closingPhrases = config.ARTICLE_CONFIG.closing_phrases;

  const randomOpening = openingHooks[Math.floor(Math.random() * openingHooks.length)];
  const randomEmphasis = emphasisPhrases[Math.floor(Math.random() * emphasisPhrases.length)];
  const randomClosing = closingPhrases[Math.floor(Math.random() * closingPhrases.length)];

  const prompt = `你是 Lman，一位科技創業家、區塊鏈與 AI 思想領袖。你有 10 年的創業經驗，從 IoT、Blockchain 到現在專注於 AI 落地應用。

# 你的寫作風格特徵 (基於 204 篇 Medium 文章分析)

**核心特色**:
- 理性、深度思考、批判性
- 第一人稱敘事，分享實戰經驗與觀察
- 問題導向，引導讀者思考
- 中短文為主 (1,000-1,500 字)

**常用手法**:
- 70% 文章使用引言強調觀點
- 善用歷史類比 (如：汽車取代馬車、資料庫演進)
- 批判主流觀點，提出獨特洞察
- 連結技術與商業價值

**經典語錄**:
${twitter_curator_style.voice_examples.map(ex => `- "${ex}"`).join('\n')}

**你的主題演進** (2015-2025):
- 2015-2017: ${topic_evolution['2015-2017']}
- 2017-2019: ${topic_evolution['2017-2019']}
- 2020-2023: ${topic_evolution['2020-2023']}
- 2023-2025: ${topic_evolution['2023-2025']}

---

# 任務：針對以下科技新聞撰寫評論文章

**新聞標題**: ${newsItem.title}
**來源**: ${newsItem.source}
**連結**: ${newsItem.url}

${newsContent ? `**新聞摘要**: ${newsContent.substring(0, 1000)}...` : ''}

---

# 寫作要求

1. **字數**: 1,000-1,500 字 (繁體中文)

2. **結構建議**:
   - 開場: 用「${randomOpening}」或類似引導方式切入
   - 論述: 2-3 個核心觀點，每個觀點可用小標題
   - 實例: 結合你的創業經驗 (BiiLabs, Tallgeese AI, IrisGo.AI)
   - 類比: 如果適合，用歷史類比說明趨勢
   - 結尾: 用「${randomClosing}」或類似方式收尾

3. **寫作技巧**:
   - 使用「${randomEmphasis}」等強調用語
   - 提出批判性思考，不盲從主流觀點
   - 連結技術與商業價值，不純談技術
   - 分享第一手經驗，不空談理論
   - 用問句引導讀者思考

4. **避免**:
   - 過度客套或修飾
   - 純技術討論無商業洞察
   - 跟風熱點沒有獨特觀點
   - 空泛的勵志內容

5. **語氣**:
   - 直白不客套
   - 有觀點不中立
   - 實務導向不空談
   - 批判思考不盲從

---

**重要**: 請直接輸出完整的繁體中文文章，不要輸出你的思考過程或計畫。立即開始撰寫文章。

請以 Lman 的風格撰寫完整文章 (繁體中文)，包含標題。文章必須是 1,000-1,500 字的完整繁體中文內容。

**輸出格式**:
# [你的文章標題]

[正文內容...]

---
*原始新聞*: ${newsItem.url}
*發表於*: ${new Date().toLocaleDateString('zh-TW')}
*作者*: Lman

現在開始撰寫文章（直接輸出繁體中文文章，不要說明或計畫）:
`;

  return prompt;
}

/**
 * 使用 Ollama 生成文章
 */
async function generateArticle(newsItem, newsContent, persona) {
  console.log('✍️  正在生成文章...\n');

  const prompt = buildArticlePrompt(newsItem, newsContent, persona);
  const models = config.AI_CONFIG.models;

  for (const model of models) {
    try {
      console.log(`🤖 使用模型: ${model}`);

      const payload = {
        model: model,
        prompt: prompt,
        stream: false,
        options: config.AI_CONFIG.generation_params
      };

      const command = `curl -s -X POST '${config.AI_CONFIG.ollama_url}' \
        -H 'Content-Type: application/json' \
        -d '${JSON.stringify(payload).replace(/'/g, "'\\''")}'`;

      const response = execSync(command, {
        encoding: 'utf-8',
        timeout: config.AI_CONFIG.timeout
      });

      const data = JSON.parse(response);

      // 優先使用 response，如果是 gpt-oss 且 response 為空才用 thinking
      let content = data.response || '';

      // 如果 response 為空或過短，檢查 thinking 欄位
      if ((!content || content.length < 500) && data.thinking) {
        // 嘗試從 thinking 中提取中文內容
        const thinkingLines = data.thinking.split('\n');
        const chineseContent = thinkingLines
          .filter(line => /[\u4e00-\u9fa5]/.test(line))
          .join('\n');

        if (chineseContent.length > content.length) {
          content = chineseContent;
        }
      }

      if (content && content.length > 500) {
        console.log('✅ 文章生成完成！\n');
        return content;
      }

      throw new Error('生成內容過短或無效');

    } catch (error) {
      console.log(`⚠️  模型 ${model} 失敗: ${error.message}`);
      continue;
    }
  }

  throw new Error('所有模型皆生成失敗');
}

/**
 * 儲存文章到檔案
 */
function saveArticle(article, newsItem) {
  const outputDir = config.PATHS.output;

  // 確保輸出目錄存在
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // 產生檔名 (日期 + 新聞標題簡化)
  const date = new Date().toISOString().split('T')[0];
  const titleSlug = newsItem.title
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .substring(0, 50);
  const filename = `${date}_${titleSlug}.md`;
  const filepath = path.join(outputDir, filename);

  // 加上 metadata
  const fullContent = `---
title: ${newsItem.title}
source: ${newsItem.source}
source_url: ${newsItem.url}
generated_at: ${new Date().toISOString()}
relevance_score: ${newsItem.relevance}/10
author: Lman (AI-assisted)
---

${article}
`;

  fs.writeFileSync(filepath, fullContent, 'utf-8');

  console.log(`💾 文章已儲存: ${filepath}`);
  return filepath;
}

/**
 * 主函數：生成文章
 */
async function generateNewsArticle(newsItem) {
  try {
    console.log('🚀 開始生成文章...\n');
    console.log(`📰 新聞標題: ${newsItem.title}`);
    console.log(`🔗 來源: ${newsItem.source}`);
    console.log(`⭐ 相關度: ${newsItem.relevance}/10\n`);

    // 1. 載入 Persona
    const persona = loadPersona();
    if (!persona) {
      throw new Error('無法載入 Persona');
    }
    console.log('✅ Persona 載入完成\n');

    // 2. 抓取新聞內容
    const newsContent = await fetchNewsContent(newsItem.url);

    // 3. 生成文章
    const article = await generateArticle(newsItem, newsContent, persona);

    // 4. 儲存文章
    const filepath = saveArticle(article, newsItem);

    console.log('\n✨ 完成！文章已生成。\n');

    return {
      success: true,
      article: article,
      filepath: filepath
    };

  } catch (error) {
    console.error('❌ 文章生成失敗:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  generateNewsArticle,
  loadPersona
};

// CLI 測試
if (require.main === module) {
  // 測試用假新聞
  const testNews = {
    title: 'OpenAI Announces GPT-5 with On-Device Processing',
    url: 'https://example.com/test',
    source: 'Test',
    relevance: 10
  };

  generateNewsArticle(testNews).then(result => {
    if (result.success) {
      console.log('📄 文章預覽:\n');
      console.log(result.article.substring(0, 500) + '...\n');
    } else {
      console.error('生成失敗');
      process.exit(1);
    }
  });
}
