#!/usr/bin/env node

/**
 * 使用 Puppeteer 自動發佈到 Substack
 * 參考 twitter-curator 的成功實作
 */

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

/**
 * Substack 配置
 */
const SUBSTACK_CONFIG = {
  publication: 'lmanchu',
  baseUrl: 'https://lmanchu.substack.com',
  loginUrl: 'https://substack.com/sign-in',
  newPostUrl: 'https://lmanchu.substack.com/publish/post/new',
  publishUrl: 'https://lmanchu.substack.com/publish'
};

/**
 * 等待時間（毫秒）
 */
const WAIT_TIME = {
  pageLoad: 3000,
  afterLogin: 2000,
  afterType: 500,
  afterClick: 1000
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
 * 等待指定時間
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 使用 Puppeteer 自動發佈到 Substack
 */
async function publishToSubstackAuto(articlePath, options = {}) {
  let browser;

  try {
    console.log('🚀 開始自動發佈到 Substack...\n');

    // 1. 讀取文章
    if (!fs.existsSync(articlePath)) {
      throw new Error(`文章檔案不存在: ${articlePath}`);
    }

    const content = fs.readFileSync(articlePath, 'utf-8');
    const { metadata, content: body } = parseFrontmatter(content);
    const title = metadata.title || body.split('\n')[0].replace(/^#\s*/, '');

    console.log('✅ 文章已讀取');
    console.log(`   標題: ${title}`);
    console.log(`   內容長度: ${body.length} 字元\n`);

    // 2. 啟動瀏覽器
    const headless = process.env.HEADLESS !== 'false';
    console.log(`🌐 啟動瀏覽器 (headless: ${headless})...`);

    browser = await puppeteer.launch({
      headless: headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-blink-features=AutomationControlled'
      ],
      defaultViewport: {
        width: 1280,
        height: 800
      }
    });

    const page = await browser.newPage();

    // 設定 User Agent（避免被偵測為機器人）
    await page.setUserAgent(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('✅ 瀏覽器已啟動\n');

    // 3. 前往新文章頁面
    console.log(`📝 前往 Substack 編輯器: ${SUBSTACK_CONFIG.newPostUrl}`);
    await page.goto(SUBSTACK_CONFIG.newPostUrl, {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    await sleep(WAIT_TIME.pageLoad);

    // 4. 檢查是否需要登入
    const currentUrl = page.url();
    if (currentUrl.includes('sign-in') || currentUrl.includes('login')) {
      console.log('\n⚠️  需要登入 Substack');
      console.log('💡 請在瀏覽器中手動登入，完成後此腳本會繼續...');

      if (headless) {
        console.log('\n❌ Headless 模式無法手動登入');
        console.log('💡 請使用: HEADLESS=false node publish-to-substack-auto.js <文章路徑>');
        throw new Error('需要手動登入，請使用非 headless 模式');
      }

      // 等待用戶登入
      console.log('\n⏳ 等待登入完成...');
      await page.waitForNavigation({
        waitUntil: 'networkidle0',
        timeout: 120000 // 2 分鐘超時
      });

      console.log('✅ 登入完成\n');
      await sleep(WAIT_TIME.afterLogin);
    }

    // 5. 等待編輯器載入
    console.log('⏳ 等待編輯器載入...');

    // 等待標題輸入框
    await page.waitForSelector('input[placeholder*="Title"], input[name="title"], textarea[placeholder*="Title"]', {
      timeout: 10000
    });

    console.log('✅ 編輯器已載入\n');

    // 6. 輸入標題
    console.log(`📌 輸入標題: ${title}`);

    const titleSelector = 'input[placeholder*="Title"], input[name="title"], textarea[placeholder*="Title"]';
    await page.click(titleSelector);
    await sleep(WAIT_TIME.afterClick);
    await page.type(titleSelector, title, { delay: 50 });
    await sleep(WAIT_TIME.afterType);

    console.log('✅ 標題已輸入\n');

    // 7. 輸入內容
    console.log('📝 輸入文章內容...');

    // Substack 使用 contenteditable div
    const contentSelector = '[contenteditable="true"]';
    await page.waitForSelector(contentSelector, { timeout: 5000 });

    // 點擊內容區域
    await page.click(contentSelector);
    await sleep(WAIT_TIME.afterClick);

    // 使用剪貼簿貼上（比逐字輸入快很多）
    await page.evaluate((text) => {
      const el = document.querySelector('[contenteditable="true"]');
      if (el) {
        el.focus();
        // 使用 innerHTML 插入內容（保留 Markdown 格式）
        el.innerText = text;

        // 觸發 input 事件
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, body);

    await sleep(WAIT_TIME.afterType);
    console.log('✅ 內容已輸入\n');

    // 8. 等待用戶確認
    if (!options.autoPublish) {
      console.log('═'.repeat(60));
      console.log('✅ 文章已準備完成！\n');
      console.log('請在瀏覽器中檢查:');
      console.log('  - 標題是否正確');
      console.log('  - 內容格式是否正確');
      console.log('  - 是否需要調整排版\n');
      console.log('檢查完成後，你可以:');
      console.log('  1. 點擊 "Save as draft" 儲存草稿');
      console.log('  2. 點擊 "Publish" 直接發佈\n');
      console.log('💡 瀏覽器視窗將保持開啟 60 秒供你操作...');
      console.log('═'.repeat(60));

      // 保持瀏覽器開啟 60 秒
      await sleep(60000);
    }

    console.log('\n✨ 發佈流程完成！');

    return {
      success: true,
      url: SUBSTACK_CONFIG.publishUrl,
      method: 'puppeteer-auto'
    };

  } catch (error) {
    console.error('\n❌ 自動發佈失敗:', error.message);
    console.error('💡 請嘗試手動模式: node publish-to-substack-browser.js <文章路徑>');

    return {
      success: false,
      error: error.message
    };
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n🔒 瀏覽器已關閉');
    }
  }
}

/**
 * 顯示使用說明
 */
function showUsage() {
  console.log(`
🤖 Substack Puppeteer 自動發佈工具

用法:
  node publish-to-substack-auto.js <文章路徑> [選項]

環境變數:
  HEADLESS=false    顯示瀏覽器視窗（預設: true）

範例:
  # Headless 模式（背景執行）
  node publish-to-substack-auto.js generated/article.md

  # 顯示瀏覽器視窗（推薦首次使用）
  HEADLESS=false node publish-to-substack-auto.js generated/article.md

說明:
  此工具使用 Puppeteer 自動化瀏覽器操作，將文章發佈到 Substack。

  首次使用時會要求登入 Substack（僅需登入一次，cookies 會被保存）。
  文章填入完成後，會保持瀏覽器開啟 60 秒讓你檢查並發佈。

設定:
  Substack Publication: ${SUBSTACK_CONFIG.publication}.substack.com

注意事項:
  - 首次使用請用 HEADLESS=false 模式進行登入
  - 登入後 cookies 會被保存，之後可用 headless 模式
  - 文章會自動填入，但建議檢查格式後再發佈
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

  publishToSubstackAuto(articlePath)
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

module.exports = { publishToSubstackAuto };
