#!/usr/bin/env node

/**
 * Article Generator Configuration
 * 科技新聞文章生成器配置
 */

module.exports = {
  // ========================================
  // 📰 新聞來源配置
  // ========================================

  NEWS_SOURCES: [
    {
      name: 'Hacker News',
      url: 'https://news.ycombinator.com/',
      type: 'hn'
    },
    {
      name: 'TechCrunch',
      url: 'https://techcrunch.com',
      type: 'web'
    },
    {
      name: 'The Verge',
      url: 'https://www.theverge.com/tech',
      type: 'web'
    }
  ],

  // ========================================
  // 🎯 興趣領域關鍵詞 (基於 204 篇 Medium 分析)
  // ========================================

  INTEREST_KEYWORDS: {
    // 高優先級 (Primary Focus 2023-2025)
    high: [
      'AI', 'LLM', 'GPT', 'Claude', 'Gemini',
      'on-premise', 'local AI', 'privacy AI',
      'AI assistant', 'personal AI',
      'startup', 'founder', 'early-stage',
      'product management', 'go-to-market'
    ],

    // 中優先級 (Core Expertise)
    medium: [
      'blockchain', 'web3', 'decentralized',
      'IoT', 'edge computing',
      'Intel', 'AI PC', 'hardware',
      'privacy', 'data ownership',
      'enterprise AI', 'SMB'
    ],

    // 低優先級 (General Interest)
    low: [
      'tech trend', 'innovation',
      'digital transformation',
      'productivity', 'automation'
    ]
  },

  // 排除關鍵詞 (避免投機、炒作類新聞)
  EXCLUDE_KEYWORDS: [
    'crypto price', 'token price', 'pump', 'moon',
    'celebrity', 'gossip', 'scandal',
    'clickbait', 'you won\'t believe'
  ],

  // ========================================
  // ✍️ 文章生成配置
  // ========================================

  ARTICLE_CONFIG: {
    // 目標字數 (基於 Medium 分析: 平均 1,287 字)
    target_word_count: {
      min: 1000,
      ideal: 1300,
      max: 1800
    },

    // 寫作風格 (來自 lman-writing-style.json)
    style: {
      tone: '理性、深度思考、批判性',
      voice: '第一人稱敘事，分享實戰經驗與觀察',
      approach: '問題導向，引導讀者思考',
      structure: {
        use_quotes: true,        // 70% 文章使用引言
        use_lists: 'occasional',  // 27% 使用列表
        use_analogies: true,     // 善用歷史類比
        use_questions: true      // 問句引導思考
      }
    },

    // 開場 hooks (從 204 篇文章提取)
    opening_hooks: [
      '這幾年觀察下來...',
      '有個有趣的現象...',
      '大家都在談X，但很少人注意到...',
      '最近被問到...'
    ],

    // 強調用語
    emphasis_phrases: [
      '說穿了，就是...',
      '關鍵在於...',
      '簡單說...',
      '這才是重點...'
    ],

    // 結尾用語
    closing_phrases: [
      '值得深思。',
      '拭目以待。',
      '這也是我們正在做的事。',
      '期待看到更多實踐。'
    ]
  },

  // ========================================
  // 🤖 AI 生成配置
  // ========================================

  AI_CONFIG: {
    // Ollama 模型選擇
    models: ['qwen2.5:14b', 'gpt-oss:20b', 'llama3.2:3b'],

    // 生成參數
    generation_params: {
      temperature: 0.7,      // 保持創意但不過度發散
      top_p: 0.9,
      num_predict: 2500      // 確保足夠長度
    },

    // API 設定
    ollama_url: 'http://localhost:11434/api/generate',
    timeout: 120000          // 2 分鐘超時
  },

  // ========================================
  // 📁 檔案路徑
  // ========================================

  PATHS: {
    persona: '/Users/lman/Dropbox/PKM-Vault/.ai-butler-system/personas/lman-writing-style.json',
    output: '/Users/lman/Dropbox/PKM-Vault/8-Articles/Generated/',
    output_backup: '/Users/lman/article-generator/generated/', // 備份位置
    cache: '/Users/lman/article-generator/cache/',
    logs: '/Users/lman/article-generator/article-generator.log'
  },

  // ========================================
  // 🔧 進階設定
  // ========================================

  // 新聞抓取設定
  FETCH_CONFIG: {
    max_news_items: 20,        // 最多抓取 20 則新聞
    time_range_hours: 48,      // 抓取過去 48 小時的新聞
    min_relevance_score: 5     // 相關度最低 5 分（滿分 10）
  },

  // 輸出格式
  OUTPUT_FORMAT: {
    default: 'markdown',       // 預設 Markdown
    options: ['markdown', 'html', 'plain']
  }
};
