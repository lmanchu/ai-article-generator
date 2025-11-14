# 🚀 快速開始指南

5 分鐘內開始生成 Lman 風格的科技文章！

---

## Step 1: 檢查前置需求 ✅

### 確認 Ollama 運行中
```bash
curl -s http://localhost:11434/api/tags
```

如果失敗，啟動 Ollama:
```bash
brew services start ollama
```

### 確認模型已安裝
```bash
ollama list | grep gpt-oss
```

如果沒有，安裝模型:
```bash
ollama pull gpt-oss:20b
```

---

## Step 2: 啟動程式 🎯

### 方法 1: 使用快速啟動腳本 (推薦)
```bash
cd /Users/lman/article-generator
./start.sh
```

### 方法 2: 直接執行
```bash
cd /Users/lman/article-generator
node index.js
```

---

## Step 3: 選擇新聞 📰

程式會自動顯示今日 Hacker News 相關新聞:

```
📋 以下是今日相關科技新聞 (按相關度排序):

1. 🔥 [8/10] OpenAI Announces GPT-5 with On-Device Processing
   來源: Hacker News | HN 熱度: 542 分 | 留言數: 156
   https://example.com/news

2. ⭐ [7/10] Blockchain meets IoT: New Security Framework
   來源: Hacker News | HN 熱度: 321 分 | 留言數: 89
   https://example.com/news2

...
```

**輸入數字** (如 `1`) 選擇要評論的新聞

---

## Step 4: 確認生成 ✍️

```
═══════════════════════════════════════════════════
📰 你選擇的新聞:
   OpenAI Announces GPT-5 with On-Device Processing
   來源: Hacker News
   相關度: 8/10
═══════════════════════════════════════════════════

是否要生成文章？(y/n):
```

輸入 `y` 確認

---

## Step 5: 等待生成 ⏳

```
🚀 開始生成文章，請稍候 (約 1-2 分鐘)...

✍️  正在生成文章...
📖 正在讀取新聞內容...
✅ 新聞內容讀取完成
✅ Persona 載入完成
🤖 使用模型: gpt-oss:20b
✅ 文章生成完成！
```

---

## Step 6: 查看結果 📄

```
═══════════════════════════════════════════════════
✨ 文章生成成功！
═══════════════════════════════════════════════════

📄 文章預覽 (前 500 字):

# GPT-5 的 On-Device 承諾，真的實現了嗎？

這幾年觀察下來，每次 OpenAI 發布新模型，市場總是一陣躁動...

─────────────────────────────────────────────────
💾 完整文章已儲存至: /Users/lman/article-generator/generated/2025-11-14_gpt5-on-device.md

是否要開啟文章檔案？(y/n):
```

輸入 `y` 自動開啟檔案

---

## Step 7: 繼續或退出 🔄

```
是否要選擇其他新聞繼續生成？(y/n):
```

- `y`: 返回新聞列表，繼續生成
- `n`: 退出程式

---

## 📂 生成的文章在哪裡？

所有文章儲存在:
```
/Users/lman/article-generator/generated/
```

檔案格式:
```
2025-11-14_openai-gpt5-on-device.md
2025-11-14_blockchain-iot-security.md
...
```

---

## 🎨 文章內容範例

```markdown
---
title: OpenAI Announces GPT-5 with On-Device Processing
source: Hacker News
source_url: https://example.com/news
generated_at: 2025-11-14T15:30:00.000Z
relevance_score: 8/10
author: Lman (AI-assisted)
---

# GPT-5 的 On-Device 承諾，真的實現了嗎？

這幾年觀察下來，每次 OpenAI 發布新模型，市場總是一陣躁動。
從 GPT-3 到 GPT-4，我們見證了 AI 能力的飛躍，但這次 GPT-5
宣稱的 On-Device Processing，讓我想起了當年 BiiLabs 時期
我們對 Edge AI 的探索...

## 技術承諾背後的商業邏輯

說穿了，On-Device AI 不只是技術問題，更是信任問題...

[約 1,200 字的完整評論]

值得深思。

---
原始新聞: https://example.com/news
發表於: 2025-11-14
作者: Lman
```

---

## 💡 使用技巧

### 技巧 1: 優先選擇高相關度新聞
- 🔥 [8-10/10]: 最符合 Lman 興趣，文章質量最好
- ⭐ [6-7/10]: 中度相關，可能需要調整
- ✨ [4-5/10]: 低度相關，慎選

### 技巧 2: 注意 HN 熱度
- 熱度 > 300: 重要新聞，值得評論
- 熱度 100-300: 中等熱度
- 熱度 < 100: 小眾話題

### 技巧 3: 查看留言數
- 留言數高 → 話題性強 → 適合評論

### 技巧 4: 文章後製
- 生成後可手動微調
- 加入最新的個人觀點
- 調整語氣和用詞

---

## 🐛 常見問題

### Q: 沒有找到相關新聞？
**A**: 可能今日新聞較少涉及 AI/Startup/Blockchain
- 降低相關度門檻 (編輯 `config.js` 的 `min_relevance_score`)
- 稍後再試 (HN 新聞持續更新)
- 擴充關鍵詞列表

### Q: 生成時間過長？
**A**: 正常情況 1-2 分鐘
- 檢查網路連線 (需抓取新聞內容)
- 檢查 Ollama 資源使用
- 嘗試較小模型 (qwen2.5:14b)

### Q: 文章風格不像 Lman？
**A**: 可能原因:
- 模型不同 (gpt-oss:20b 效果最好)
- 新聞主題不熟悉
- 可手動微調 Persona (config.js)

### Q: 想用英文生成？
**A**: 編輯 `article-generator.js`:
- 將 prompt 改為英文
- 修改 "繁體中文" → "English"

---

## 🚀 進階使用

### 自訂興趣關鍵詞

編輯 `config.js`:

```javascript
INTEREST_KEYWORDS: {
  high: [
    'AI', 'LLM', 'startup',
    '你的關鍵詞'  // 新增
  ],
  // ...
}
```

### 調整文章長度

編輯 `config.js`:

```javascript
ARTICLE_CONFIG: {
  target_word_count: {
    min: 800,   // 原 1000
    ideal: 1000, // 原 1300
    max: 1500   // 原 1800
  }
}
```

### 批次生成

```bash
# 自動選擇 Top 3 新聞批次生成 (未來功能)
node batch-generate.js
```

---

## 📚 相關文件

- **完整說明**: [README.md](README.md)
- **配置文件**: [config.js](config.js)
- **Persona**: `~/.ai-butler-system/personas/lman-writing-style.json`

---

**開始使用吧！** ✨

```bash
./start.sh
```
