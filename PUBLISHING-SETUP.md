# 📰 自動發佈設定指南

完整的 Medium 和 Substack 自動發佈設定教學。

---

## 🎯 快速設定（5 分鐘）

### 1. Medium 設定

#### Step 1: 取得 Integration Token

1. 登入 Medium: https://medium.com
2. 前往設定: https://medium.com/me/settings/security
3. 找到 "Integration tokens" 區塊
4. 點擊 "Get token"
5. 輸入描述（如："AI Article Generator"）
6. 複製產生的 token（格式：`2a24...`）

#### Step 2: 儲存 Token（兩種方式）

**方式 A: 儲存到 macOS Keychain（推薦）**
```bash
security add-generic-password \
  -a "lmanchu" \
  -s "medium-integration-token" \
  -w "YOUR_TOKEN_HERE"
```

**方式 B: 環境變數**
```bash
# 加到 ~/.zshrc
echo 'export MEDIUM_TOKEN="YOUR_TOKEN_HERE"' >> ~/.zshrc
source ~/.zshrc
```

#### Step 3: 測試連線

```bash
cd /Users/lman/article-generator

# 測試 token 是否正確
node -e "
const { execSync } = require('child_process');
const token = process.env.MEDIUM_TOKEN || execSync('security find-generic-password -s \"medium-integration-token\" -w 2>/dev/null', {encoding: 'utf-8'}).trim();
const res = execSync(\`curl -s -H 'Authorization: Bearer \${token}' https://api.medium.com/v1/me\`, {encoding: 'utf-8'});
console.log(JSON.parse(res));
"
```

應該看到你的 Medium 帳號資訊。

---

### 2. Substack 設定

#### Step 1: 啟用 Email-to-Post

1. 登入 Substack: https://lmanchu.substack.com
2. 前往 Settings → Publishing
3. 找到 "Email to publish" 區塊
4. 點擊 "Enable" 啟用
5. 複製專屬 email 地址（格式：`post@lmanchu.substack.com`）

#### Step 2: 更新設定（已完成）

在 `publish-to-substack.js` 中已設定：
```javascript
const SUBSTACK_CONFIG = {
  publication: 'lmanchu',
  emailAddress: 'post@lmanchu.substack.com',
};
```

#### Step 3: 測試 Email-to-Post

發送測試郵件確認功能正常：
```bash
# 使用 macOS Mail.app 測試
node publish-to-substack.js generated/test-article.md --method=macos-mail
```

或手動發送測試郵件到 `post@lmanchu.substack.com`。

---

## 🚀 使用方式

### 發佈到單一平台

**Medium（草稿）**:
```bash
node publish-to-medium.js generated/article.md --draft
```

**Medium（直接發佈）**:
```bash
node publish-to-medium.js generated/article.md --publish
```

**Substack（手動模式）**:
```bash
node publish-to-substack.js generated/article.md
```

### 一次發佈到多平台

**Medium + Substack（推薦）**:
```bash
node publish.js generated/article.md \
  --platforms=medium,substack \
  --medium:draft
```

**所有平台**:
```bash
node publish.js generated/article.md --platforms=all
```

---

## 📋 完整工作流程

### 從生成到發佈（完整流程）

```bash
# 1. 生成文章
node index.js
# 或
node auto-generate.js 2

# 2. 在 Obsidian 中編輯和審閱
# （文章在 ~/Dropbox/PKM-Vault/8-Articles/Generated/）

# 3. 一鍵發佈到多平台
node publish.js ~/Dropbox/PKM-Vault/8-Articles/Generated/2025-11-14_article-name.md \
  --platforms=medium,substack \
  --medium:publish

# 4. Medium 自動發佈完成
#    Substack 需前往網站發佈草稿
```

---

## 🔧 進階設定

### Medium 進階選項

**不通知追蹤者（靜默發佈）**:
```bash
node publish-to-medium.js article.md --publish --no-notify
```

**發佈到 Publication**:
需修改 `publish-to-medium.js` 添加 `publicationId` 參數。

### Substack 發送方式

**方式 1: 手動複製（預設，最穩定）**
```bash
node publish-to-substack.js article.md
# → 會顯示手動發送步驟和儲存 HTML 檔案
```

**方式 2: macOS Mail.app 自動發送**
```bash
node publish-to-substack.js article.md --method=macos-mail
# → 自動開啟 Mail.app 並建立郵件
```

**方式 3: Gmail MCP（在 Claude Code 環境）**
```bash
# 在 Claude Code 中執行
node publish-to-substack.js article.md --method=gmail-mcp
```

---

## 🛠️ 故障排除

### Medium 問題

**問題 1: Token 無效**
```
Error: Medium API 錯誤: {"code":401,"message":"Unauthorized"}
```

**解決**:
1. 重新產生 Integration Token
2. 確認 token 正確儲存到 Keychain 或環境變數
3. 測試連線（見上方 Step 3）

**問題 2: 找不到使用者**
```
Error: Medium API 錯誤: {"code":404}
```

**解決**:
確認你的 Medium 帳號已啟用（非新帳號）。

### Substack 問題

**問題 1: Email-to-Post 未啟用**

**解決**:
1. 前往 Substack Settings → Publishing
2. 確認 "Email to publish" 已啟用
3. 複製正確的 email 地址
4. 發送測試郵件確認

**問題 2: macOS Mail.app 無法發送**

**解決**:
1. 確認 Mail.app 已設定郵件帳號
2. 檢查系統權限（System Settings → Privacy → Automation）
3. 改用手動模式或 Gmail MCP

---

## 📊 發佈後檢查清單

### Medium

- [ ] 前往 Medium 檢視文章: https://medium.com/me/stories/drafts
- [ ] 檢查格式（標題、內容、連結）
- [ ] 添加封面圖片（如需要）
- [ ] 檢查標籤（最多 5 個）
- [ ] 如果是草稿，點擊 "Publish" 發佈

### Substack

- [ ] 前往 Substack 後台: https://lmanchu.substack.com/publish
- [ ] 檢視自動建立的草稿
- [ ] 調整格式和排版
- [ ] 設定發送選項：
  - [ ] Send to all subscribers（發送給所有訂閱者）
  - [ ] Free subscribers only（僅免費訂閱者）
  - [ ] Paid subscribers only（僅付費訂閱者）
- [ ] 設定排程（立即或延後）
- [ ] 點擊 "Publish" 發佈

---

## 🎯 最佳實踐

### 1. 發佈節奏建議

- **Medium**: 每週 1-2 篇（建立穩定產出）
- **Substack**: 每週 1 篇（培養訂閱習慣）
- **交叉發佈**: 同一篇文章可同時發到兩個平台

### 2. 內容策略

**Medium**:
- 適合：技術深度、產業觀察、案例分析
- 善用標籤: AI, Blockchain, Startup, Product Management
- 建立 Publication（如："Lman's Tech Insights"）

**Substack**:
- 適合：個人觀點、連載專欄、深度長文
- 混合免費/付費內容（Freemium 模式）
- 建立固定欄目（如：週報、月度回顧）

### 3. 標題優化

- Medium: 搜尋引擎友善（SEO 優化）
- Substack: 吸引訂閱者點擊（好奇心導向）
- 可以兩平台用不同標題

### 4. 封面圖片

- Medium: 建議 1200x630px 以上
- Substack: 建議 1200x675px（16:9）
- 可使用 Unsplash, Pexels 免費圖庫

---

## 🔗 快速參考

### 常用命令

```bash
# 生成文章（互動模式）
node index.js

# 生成文章（快速模式）
node auto-generate.js 2

# 發佈到 Medium（草稿）
node publish-to-medium.js generated/article.md --draft

# 發佈到 Substack
node publish-to-substack.js generated/article.md

# 一鍵多平台發佈
node publish.js generated/article.md --platforms=medium,substack
```

### 重要連結

- **Medium 設定**: https://medium.com/me/settings/security
- **Medium 文章**: https://medium.com/me/stories
- **Substack 後台**: https://lmanchu.substack.com/publish
- **Substack 設定**: https://lmanchu.substack.com/settings

---

**建立日期**: 2025-11-14
**維護者**: Iris (Melchior)
