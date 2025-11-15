#!/usr/bin/env node

/**
 * 使用 BrowserOS 自動發佈到 Substack
 * 因為 Substack 沒有官方 API，使用 browser automation
 */

const fs = require('fs');
const path = require('path');

/**
 * Substack 配置
 */
const SUBSTACK_CONFIG = {
  publication: 'lmanchu',
  loginUrl: 'https://substack.com/sign-in',
  newPostUrl: 'https://lmanchu.substack.com/publish/post/new',
  publishUrl: 'https://lmanchu.substack.com/publish'
};

/**
 * 解析文章的 frontmatter
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { metadata: {}, content: content };
  }

  const frontmatter = match[1];
  const body = match[2];

  const metadata = {};
  frontmatter.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      metadata[key.trim()] = valueParts.join(':').trim();
    }
  });

  return { metadata, content: body };
}

/**
 * 使用 BrowserOS 發佈到 Substack
 *
 * 注意: 這個函數需要在 Claude Code 環境中執行，
 * 因為它依賴 MCP BrowserOS 工具
 */
async function publishToSubstackViaBrowser(articlePath, options = {}) {
  try {
    console.log('🌐 開始使用 BrowserOS 發佈到 Substack...\n');

    // 1. 讀取文章
    if (!fs.existsSync(articlePath)) {
      throw new Error(`文章檔案不存在: ${articlePath}`);
    }

    const content = fs.readFileSync(articlePath, 'utf-8');
    const { metadata, content: body } = parseFrontmatter(content);
    const title = metadata.title || body.split('\n')[0].replace(/^#\s*/, '');

    console.log('✅ 文章已讀取');
    console.log(`   標題: ${title}`);
    console.log(`   發佈位置: https://${SUBSTACK_CONFIG.publication}.substack.com\n`);

    // 2. 顯示 BrowserOS 自動化步驟
    console.log('📋 BrowserOS 自動化步驟:\n');
    console.log('請在 Claude Code 環境中執行以下步驟:\n');

    console.log('1️⃣ 開啟 Substack 編輯器:');
    console.log(`   URL: ${SUBSTACK_CONFIG.newPostUrl}\n`);

    console.log('2️⃣ 等待頁面載入並輸入標題:');
    console.log(`   標題: ${title}\n`);

    console.log('3️⃣ 點擊內容區域並貼上文章:');
    console.log(`   內容長度: ${body.length} 字元\n`);

    console.log('4️⃣ 檢查預覽並發佈');
    console.log('   → 可選擇 "Save as draft" 或 "Publish now"\n');

    // 3. 儲存內容到暫存檔（方便複製）
    const tempPath = articlePath.replace('.md', '_substack_content.md');
    fs.writeFileSync(tempPath, body, 'utf-8');

    console.log('💾 文章內容已儲存到:');
    console.log(`   ${tempPath}\n`);

    // 4. 提供手動步驟說明
    console.log('═'.repeat(60));
    console.log('🎯 手動發佈步驟:\n');
    console.log(`1. 開啟: ${SUBSTACK_CONFIG.newPostUrl}`);
    console.log('2. 登入你的 Substack 帳號（如未登入）');
    console.log(`3. 輸入標題: ${title}`);
    console.log('4. 複製並貼上文章內容（已儲存到上述檔案）');
    console.log('5. 檢查格式和排版');
    console.log('6. 點擊 "Publish" 或 "Save as draft"\n');
    console.log('💡 提示: Substack 編輯器支援 Markdown 格式');
    console.log(`💡 文章發佈後可在: ${SUBSTACK_CONFIG.publishUrl} 查看\n`);
    console.log('═'.repeat(60));

    return {
      success: true,
      url: SUBSTACK_CONFIG.publishUrl,
      method: 'browser-manual',
      tempFile: tempPath
    };

  } catch (error) {
    console.error('\n❌ 發佈流程失敗:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * 顯示使用說明
 */
function showUsage() {
  console.log(`
🌐 Substack BrowserOS 自動發佈工具

用法:
  node publish-to-substack-browser.js <文章路徑>

範例:
  node publish-to-substack-browser.js generated/article.md

說明:
  由於 Substack 移除了 Email-to-Post 功能且沒有官方 API,
  此工具會準備文章內容並提供發佈步驟指引。

  在 Claude Code 環境中可使用 BrowserOS 工具自動化瀏覽器操作。

設定:
  Substack Publication: ${SUBSTACK_CONFIG.publication}.substack.com
  新文章 URL: ${SUBSTACK_CONFIG.newPostUrl}

注意事項:
  - Substack 無官方 API
  - 建議使用 Claude Code + BrowserOS 進行自動化
  - 或按照手動步驟說明操作
`);
}

// CLI 執行
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const articlePath = args[0];

  publishToSubstackViaBrowser(articlePath)
    .then(result => {
      if (result.success) {
        console.log('\n✨ 發佈準備完成！');
        process.exit(0);
      } else {
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ 錯誤:', error);
      process.exit(1);
    });
}

module.exports = { publishToSubstackViaBrowser, SUBSTACK_CONFIG };
