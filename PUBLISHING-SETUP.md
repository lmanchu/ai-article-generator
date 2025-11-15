# 📰 自動發佈設定指南 (2025)

完整的 Medium 和 Substack 自動發佈設定教學。

**⚠️ 重要更新（2025 年 1 月）**:
- **Medium**: 2025/1/1 起不再發放新的 Integration Tokens（現有 token 仍可用）
- **Substack**: Email-to-Post 功能已移除，改用 Puppeteer 瀏覽器自動化

---

## 🎯 快速設定（5 分鐘）

### Step 1: 安裝依賴

```bash
cd /Users/lman/article-generator
npm install
```

這會安裝:
- `puppeteer` - 瀏覽器自動化工具
- `puppeteer-extra` + `puppeteer-extra-plugin-stealth` - 反偵測插件

### Step 2: 檢查 Medium Token 狀態

```bash
npm run check-medium
```

這個命令會檢查:
1. 環境變數中是否有 `MEDIUM_TOKEN`
2. macOS Keychain 中是否有儲存的 token
3. Token 是否仍然有效

**如果你沒有 Medium Token**:
- Medium 在 2025/1/1 後已停止發放新 token
- 你將無法使用 Medium API 發佈
- 替代方案: 手動複製貼上，或考慮其他平台（Dev.to, Hashnode）

**如果你有現有的 Medium Token**:
- 前往 https://medium.com/me/settings/security
- 找到 "Integration tokens" 區塊
- 複製你的 token 並執行:

```bash
security add-generic-password \
  -a "lmanchu" \
  -s "medium-integration-token" \
  -w "YOUR_TOKEN_HERE"
```

### Step 3: 測試發佈工具

**測試 Substack（Puppeteer 自動化）**:

```bash
# 首次使用（需要登入，顯示瀏覽器視窗）
HEADLESS=false npm run publish:substack generated/your-article.md

# 登入後，可用 headless 模式
npm run publish:substack generated/your-article.md
```

**測試 Medium（如果有 token）**:

```bash
npm run publish:medium generated/your-article.md --draft
```

---

## 🚀 使用方式

### 1. 發佈到單一平台

#### Substack（Puppeteer 自動化 - 推薦）

```bash
# 顯示瀏覽器視窗（首次使用，需登入）
HEADLESS=false node publish-to-substack-auto.js generated/article.md

# 背景模式（登入後可用）
node publish-to-substack-auto.js generated/article.md
```

**工作流程**:
1. 腳本會開啟 Substack 編輯器
2. 如需登入，會暫停等待你登入
3. 登入後自動填入標題和內容
4. 保持瀏覽器開啟 60 秒讓你檢查
5. 你可以點擊 "Publish" 或 "Save as draft"

#### Substack（手動模式 - 備案）

```bash
node publish-to-substack-browser.js generated/article.md
```

這會:
- 準備文章內容
- 儲存為 HTML 檔案
- 顯示手動發佈步驟

#### Medium（需要 Integration Token）

```bash
# 發佈為草稿
node publish-to-medium.js generated/article.md --draft

# 直接公開發佈
node publish-to-medium.js generated/article.md --publish

# 發佈但不通知追蹤者
node publish-to-medium.js generated/article.md --publish --no-notify
```

### 2. 一次發佈到多平台

```bash
# Substack（自動化）
HEADLESS=false node publish.js generated/article.md --platforms=substack

# Medium + Substack（需要 Medium token）
node publish.js generated/article.md \
  --platforms=medium,substack \
  --medium:publish

# Substack 手動模式
node publish.js generated/article.md \
  --platforms=substack \
  --substack:manual
```

---

## 📋 完整工作流程

### 從生成到發佈（完整流程）

```bash
# 1. 生成文章
node auto-generate.js 2

# 2. 在 Obsidian 中編輯和審閱
# （文章在 ~/Dropbox/PKM-Vault/8-Articles/Generated/）

# 3. 檢查 Medium token 狀態（可選）
npm run check-medium

# 4. 發佈到 Substack（Puppeteer 自動化）
HEADLESS=false node publish.js \
  ~/Dropbox/PKM-Vault/8-Articles/Generated/2025-11-14_article-name.md \
  --platforms=substack

# 5. 如果有 Medium token，也可以同時發佈
node publish.js \
  ~/Dropbox/PKM-Vault/8-Articles/Generated/2025-11-14_article-name.md \
  --platforms=medium,substack \
  --medium:draft
```

---

## 🔧 進階設定

### Puppeteer 瀏覽器設定

**顯示/隱藏瀏覽器**:

```bash
# 顯示瀏覽器（推薦首次使用）
HEADLESS=false node publish-to-substack-auto.js article.md

# 隱藏瀏覽器（背景執行）
HEADLESS=true node publish-to-substack-auto.js article.md
# 或
node publish-to-substack-auto.js article.md
```

**Cookies 和登入狀態**:

Puppeteer 會在首次登入後保存 cookies（如果使用 `userDataDir`）。
目前版本需要每次登入，未來可以添加 session 持久化。

### Medium 進階選項

**靜默發佈（不通知追蹤者）**:

```bash
node publish-to-medium.js article.md --publish --no-notify
```

**檢查 Token 有效性**:

```bash
# 使用 check-medium-token.js
npm run check-medium

# 或手動測試
curl -H "Authorization: Bearer YOUR_TOKEN" \
  https://api.medium.com/v1/me
```

---

## 🛠️ 故障排除

### Puppeteer 問題

**問題 1: Chromium 下載失敗**

```bash
# 手動下載 Chromium
npx puppeteer browsers install chrome
```

**問題 2: M1/M2 Mac 相容性問題**

Puppeteer v21+ 已支援 Apple Silicon，確保使用最新版本:

```bash
npm install puppeteer@latest
```

**問題 3: Headless 模式登入問題**

首次使用必須用 `HEADLESS=false` 模式登入:

```bash
HEADLESS=false node publish-to-substack-auto.js article.md
```

### Medium 問題

**問題 1: Token 無效**

```
Error: Medium API 錯誤: {"code":401,"message":"Unauthorized"}
```

**解決**:
1. 執行 `npm run check-medium` 檢查 token 狀態
2. 如果 token 過期，需重新產生（前提是你在 2025/1/1 前已有帳號）
3. 前往 https://medium.com/me/settings/security 檢查

**問題 2: 找不到 Integration Token 設定**

Medium 在 2025/1/1 後關閉了新 token 申請。如果你之前沒有產生過 token，
現在無法透過 API 發佈到 Medium。

**替代方案**:
- 手動複製貼上到 Medium 網站
- 考慮其他支援 API 的平台（Dev.to, Hashnode）
- 使用 Puppeteer 自動化（未來可能添加）

### Substack 問題

**問題 1: 無法找到編輯器元素**

```
Error: Timeout waiting for selector
```

**解決**:
1. 確認 Substack 網站結構沒有改變
2. 使用 `HEADLESS=false` 模式查看實際狀況
3. 可能需要更新選擇器（selector）

**問題 2: 內容格式跑掉**

Substack 的編輯器會自動處理 Markdown 和 HTML。
如果格式有問題:
1. 使用 `--substack:manual` 手動模式
2. 複製原始 Markdown 內容到編輯器
3. Substack 會自動轉換格式

---

## 📊 發佈後檢查清單

### Medium

- [ ] 前往 Medium 檢視文章: https://medium.com/me/stories/drafts
- [ ] 檢查格式（標題、內容、連結）
- [ ] 添加封面圖片（如需要）
- [ ] 檢查標籤（最多 5 個）
- [ ] 如果是草稿，點擊 "Publish" 發佈

### Substack

- [ ] 檢視 Puppeteer 填入的內容
- [ ] 調整格式和排版（如需要）
- [ ] 添加封面圖片
- [ ] 設定發送選項:
  - [ ] Send to all subscribers（發送給所有訂閱者）
  - [ ] Free subscribers only（僅免費訂閱者）
  - [ ] Paid subscribers only（僅付費訂閱者）
- [ ] 設定排程（立即或延後）
- [ ] 點擊 "Publish" 發佈

---

## 🎯 最佳實踐

### 1. 發佈節奏建議

- **Substack**: 每週 1 篇（培養訂閱習慣）
- **Medium**: 每週 1-2 篇（建立穩定產出）
- **交叉發佈**: 同一篇文章可同時發到兩個平台

### 2. 自動化建議

**Substack Puppeteer 自動化**:
- ✅ 首次使用 `HEADLESS=false` 登入
- ✅ 登入後可用 headless 模式
- ✅ 保持瀏覽器開啟 60 秒檢查內容
- ✅ 手動點擊 "Publish"（避免誤發佈）

**Medium API**:
- ✅ 如果有 token，優先使用 API（穩定可靠）
- ✅ 使用 `--draft` 模式先檢查
- ✅ 檢查無誤後再用 `--publish` 公開

### 3. 內容策略

**Medium**:
- 適合：技術深度、產業觀察、案例分析
- 善用標籤: AI, Blockchain, Startup, Product Management

**Substack**:
- 適合：個人觀點、連載專欄、深度長文
- 建立固定欄目（如：週報、月度回顧）
- 混合免費/付費內容（Freemium 模式）

---

## 🔗 快速參考

### 常用命令

```bash
# 檢查 Medium token
npm run check-medium

# 生成文章
node auto-generate.js 2

# 發佈到 Substack（Puppeteer）
HEADLESS=false npm run publish:substack generated/article.md

# 發佈到 Medium（如有 token）
npm run publish:medium generated/article.md --draft

# 一鍵多平台發佈
HEADLESS=false node publish.js generated/article.md --platforms=substack
```

### 重要連結

- **Medium 設定**: https://medium.com/me/settings/security
- **Medium 文章**: https://medium.com/me/stories
- **Substack 後台**: https://lmanchu.substack.com/publish
- **Substack 設定**: https://lmanchu.substack.com/settings

### 替代發佈平台（有 API 支援）

如果 Medium 無法使用，考慮這些平台:

- **Dev.to**: 有完整 API，支援 Markdown
  - API Docs: https://developers.forem.com/api

- **Hashnode**: 有 GraphQL API
  - API Docs: https://api.hashnode.com

- **Ghost**: 開源平台，完整 API
  - 需自架或付費託管

---

## 📚 技術參考

### Medium API

- **官方文件**: https://github.com/Medium/medium-api-docs
- **狀態**: ⚠️ 已於 2023 年停止維護，2025/1/1 起不再發放新 token
- **現有 token**: 仍可繼續使用

### Substack

- **官方 API**: ❌ 無
- **Email-to-Post**: ❌ 已移除
- **替代方案**: Puppeteer 瀏覽器自動化

### Puppeteer

- **官方文件**: https://pptr.dev
- **版本**: v21+ (支援 Apple Silicon)
- **反偵測**: 使用 puppeteer-extra-plugin-stealth

---

**建立日期**: 2025-11-15
**上次更新**: 2025-11-15
**維護者**: Iris (Melchior)
**版本**: 2.0 (2025 年更新版)
