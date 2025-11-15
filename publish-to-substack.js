#!/usr/bin/env node

/**
 * Publish to Substack
 * 透過 Email 自動發佈文章到 Substack
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Substack 配置
 */
const SUBSTACK_CONFIG = {
  publication: 'lmanchu',  // 你的 Substack subdomain
  emailAddress: 'post@lmanchu.substack.com',  // Substack Email-to-Post 地址
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
 * 將 Markdown 轉換為 Substack 友善的 HTML
 */
function markdownToSubstackHtml(markdown) {
  // 簡單的 Markdown → HTML 轉換
  // Substack 支援基本 HTML 標籤

  let html = markdown;

  // 標題
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

  // 粗體和斜體
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 連結
  html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2">$1</a>');

  // 引用
  html = html.replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>');

  // 程式碼區塊
  html = html.replace(/```(\w+)?\n([\s\S]+?)```/g, '<pre><code>$2</code></pre>');
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');

  // 段落
  html = html.split('\n\n').map(p => {
    if (!p.startsWith('<') && p.trim().length > 0) {
      return `<p>${p}</p>`;
    }
    return p;
  }).join('\n');

  return html;
}

/**
 * 透過 Gmail MCP 發送郵件到 Substack
 */
async function sendViaGmailMCP(subject, htmlBody) {
  console.log('📧 使用 Gmail MCP 發送...');

  // 注意：這裡需要在 Claude Code 環境中使用 MCP Gmail 工具
  // 如果在 Node.js 直接執行，需要改用其他方式

  console.log('⚠️  Gmail MCP 整合需要在 Claude Code 環境中執行');
  console.log('⚠️  或使用 publish.js 腳本來呼叫此功能');

  return false;
}

/**
 * 透過 macOS Mail.app 發送（備用方案）
 */
function sendViaMacOSMail(toEmail, subject, htmlBody) {
  console.log('📧 使用 macOS Mail.app 發送...');

  // 建立 AppleScript
  const appleScript = `
tell application "Mail"
  set newMessage to make new outgoing message with properties {subject:"${subject.replace(/"/g, '\\"')}", visible:true}
  tell newMessage
    make new to recipient at end of to recipients with properties {address:"${toEmail}"}
    set html content to "${htmlBody.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"
  end tell
  send newMessage
end tell
`;

  try {
    execSync(`osascript -e '${appleScript}'`, { encoding: 'utf-8' });
    return true;
  } catch (error) {
    console.error('❌ macOS Mail 發送失敗:', error.message);
    return false;
  }
}

/**
 * 顯示手動發送指示
 */
function showManualInstructions(subject, htmlBody, articlePath) {
  const tempHtmlPath = articlePath.replace('.md', '_substack.html');
  fs.writeFileSync(tempHtmlPath, htmlBody, 'utf-8');

  console.log('\n📧 手動發送步驟:\n');
  console.log('1. 開啟你的郵件程式（Gmail, Outlook 等）');
  console.log(`2. 收件人: ${SUBSTACK_CONFIG.emailAddress}`);
  console.log(`3. 主旨: ${subject}`);
  console.log(`4. 內文已儲存到: ${tempHtmlPath}`);
  console.log('5. 複製 HTML 內容到郵件正文');
  console.log('6. 發送郵件\n');
  console.log('💡 提示: Substack 會在收到郵件後自動建立草稿');
  console.log(`💡 前往 https://${SUBSTACK_CONFIG.publication}.substack.com/publish 檢視草稿\n`);
}

/**
 * 發佈到 Substack
 */
async function publishToSubstack(articlePath, options = {}) {
  try {
    console.log('📰 開始發佈到 Substack...\n');

    // 1. 讀取文章
    if (!fs.existsSync(articlePath)) {
      throw new Error(`文章檔案不存在: ${articlePath}`);
    }

    const content = fs.readFileSync(articlePath, 'utf-8');
    const { metadata, content: body } = parseFrontmatter(content);
    console.log('✅ 文章已讀取');

    // 2. 準備內容
    const title = metadata.title || body.split('\n')[0].replace(/^#\s*/, '');
    const htmlBody = markdownToSubstackHtml(body);

    console.log('\n📝 發佈資訊:');
    console.log(`   標題: ${title}`);
    console.log(`   發佈位置: https://${SUBSTACK_CONFIG.publication}.substack.com`);
    console.log(`   Email 地址: ${SUBSTACK_CONFIG.emailAddress}\n`);

    // 3. 發送方式選擇
    if (options.method === 'gmail-mcp') {
      // 方法 1: Gmail MCP（需要在 Claude Code 環境）
      const sent = await sendViaGmailMCP(title, htmlBody);
      if (!sent) {
        console.log('⚠️  切換到手動模式\n');
        showManualInstructions(title, htmlBody, articlePath);
      }
    } else if (options.method === 'macos-mail') {
      // 方法 2: macOS Mail.app
      const sent = sendViaMacOSMail(SUBSTACK_CONFIG.emailAddress, title, htmlBody);
      if (!sent) {
        console.log('⚠️  切換到手動模式\n');
        showManualInstructions(title, htmlBody, articlePath);
      }
    } else {
      // 方法 3: 手動發送（預設）
      showManualInstructions(title, htmlBody, articlePath);
    }

    console.log('✅ Substack 發佈流程已啟動');
    console.log('\n💡 接下來的步驟:');
    console.log(`1. 前往 https://${SUBSTACK_CONFIG.publication}.substack.com/publish`);
    console.log('2. 檢視自動建立的草稿');
    console.log('3. 編輯格式和設定');
    console.log('4. 點擊 "Publish" 發佈\n');

    return {
      success: true,
      url: `https://${SUBSTACK_CONFIG.publication}.substack.com/publish`,
      method: options.method || 'manual'
    };

  } catch (error) {
    console.error('\n❌ 發佈失敗:', error.message);
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
📰 Substack 自動發佈工具

用法:
  node publish-to-substack.js <文章路徑> [選項]

選項:
  --method=gmail-mcp    使用 Gmail MCP 發送（需在 Claude Code 環境）
  --method=macos-mail   使用 macOS Mail.app 發送
  （預設）               顯示手動發送指示

範例:
  # 手動模式（預設）
  node publish-to-substack.js generated/article.md

  # 使用 macOS Mail.app
  node publish-to-substack.js generated/article.md --method=macos-mail

  # 使用 Gmail MCP（需在 Claude Code）
  node publish-to-substack.js generated/article.md --method=gmail-mcp

設定:
  Substack Publication: ${SUBSTACK_CONFIG.publication}.substack.com
  Email-to-Post 地址: ${SUBSTACK_CONFIG.emailAddress}

取得 Email-to-Post 地址:
  1. 登入 Substack
  2. 前往 Settings → Publishing
  3. 啟用 "Email to publish"
  4. 複製你的專屬 email 地址（格式: post@yourname.substack.com）

注意事項:
  - Substack 無官方 API，此工具使用 Email-to-Post 功能
  - 發送後需手動到 Substack 網站檢視草稿並發佈
  - 建議先測試確認 Email-to-Post 功能已啟用
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
  const methodArg = args.find(arg => arg.startsWith('--method='));
  const method = methodArg ? methodArg.split('=')[1] : 'manual';

  const options = { method };

  publishToSubstack(articlePath, options)
    .then(result => {
      if (result.success) {
        console.log('\n✨ 完成！');
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

module.exports = { publishToSubstack, SUBSTACK_CONFIG };
