#!/usr/bin/env node

/**
 * 統一發佈介面
 * 一次發佈到多個平台（Medium, Substack, etc.）
 */

const fs = require('fs');
const path = require('path');
const { publishToMedium } = require('./publish-to-medium');
const { publishToSubstack } = require('./publish-to-substack');

/**
 * 支援的平台列表
 */
const PLATFORMS = {
  medium: {
    name: 'Medium',
    emoji: '📰',
    handler: publishToMedium
  },
  substack: {
    name: 'Substack',
    emoji: '📧',
    handler: publishToSubstack
  }
};

/**
 * 發佈到指定平台
 */
async function publishToPlatforms(articlePath, platforms, options = {}) {
  console.log('🚀 開始多平台發佈流程\n');
  console.log('═'.repeat(60));
  console.log(`📄 文章: ${path.basename(articlePath)}`);
  console.log(`🎯 目標平台: ${platforms.map(p => PLATFORMS[p].name).join(', ')}`);
  console.log('═'.repeat(60));
  console.log('');

  const results = {};

  for (const platformKey of platforms) {
    const platform = PLATFORMS[platformKey];

    if (!platform) {
      console.log(`⚠️  未知平台: ${platformKey}，跳過\n`);
      continue;
    }

    console.log(`${platform.emoji} 發佈到 ${platform.name}...`);
    console.log('-'.repeat(60));

    try {
      const result = await platform.handler(articlePath, options[platformKey] || {});
      results[platformKey] = result;

      if (result.success) {
        console.log(`✅ ${platform.name} 發佈成功\n`);
      } else {
        console.log(`❌ ${platform.name} 發佈失敗: ${result.error}\n`);
      }
    } catch (error) {
      console.error(`❌ ${platform.name} 發佈錯誤:`, error.message, '\n');
      results[platformKey] = {
        success: false,
        error: error.message
      };
    }
  }

  // 顯示總結
  console.log('═'.repeat(60));
  console.log('📊 發佈總結');
  console.log('═'.repeat(60));

  let successCount = 0;
  let failCount = 0;

  for (const [platformKey, result] of Object.entries(results)) {
    const platform = PLATFORMS[platformKey];
    const status = result.success ? '✅ 成功' : '❌ 失敗';
    const url = result.url ? `\n   連結: ${result.url}` : '';

    console.log(`${platform.emoji} ${platform.name}: ${status}${url}`);

    if (result.success) successCount++;
    else failCount++;
  }

  console.log('═'.repeat(60));
  console.log(`總計: ${successCount} 成功, ${failCount} 失敗\n`);

  return results;
}

/**
 * 顯示使用說明
 */
function showUsage() {
  console.log(`
🚀 多平台文章發佈工具

用法:
  node publish.js <文章路徑> --platforms=<平台列表> [選項]

平台:
  medium      Medium.com
  substack    Substack
  all         所有平台

選項:
  --platforms=<列表>     指定發佈平台（逗號分隔）
  --medium:draft         Medium 發佈為草稿
  --medium:publish       Medium 直接公開發佈
  --medium:no-notify     Medium 不通知追蹤者
  --substack:method=<m>  Substack 發送方式（manual, macos-mail, gmail-mcp）

範例:
  # 發佈到 Medium 和 Substack
  node publish.js generated/article.md --platforms=medium,substack

  # 只發佈到 Medium（直接公開）
  node publish.js generated/article.md --platforms=medium --medium:publish

  # 發佈到所有平台
  node publish.js generated/article.md --platforms=all

  # Medium 草稿 + Substack 手動模式
  node publish.js generated/article.md --platforms=medium,substack --medium:draft

詳細說明:
  各平台的詳細選項請參考:
  - Medium: node publish-to-medium.js --help
  - Substack: node publish-to-substack.js --help

設定:
  請確保已設定各平台的必要憑證:
  - Medium: MEDIUM_TOKEN 環境變數或 Keychain
  - Substack: Email-to-Post 功能已啟用
`);
}

/**
 * 解析命令列參數
 */
function parseArgs(args) {
  const articlePath = args.find(arg => !arg.startsWith('--'));
  const platformsArg = args.find(arg => arg.startsWith('--platforms='));

  if (!articlePath || !platformsArg) {
    return null;
  }

  let platforms = platformsArg.split('=')[1].split(',');

  // 'all' 表示所有平台
  if (platforms.includes('all')) {
    platforms = Object.keys(PLATFORMS);
  }

  // 解析各平台的選項
  const options = {};

  platforms.forEach(platform => {
    options[platform] = {};

    // Medium 選項
    if (platform === 'medium') {
      options.medium.draft = args.includes('--medium:draft');
      options.medium.publish = args.includes('--medium:publish');
      options.medium.notify = !args.includes('--medium:no-notify');

      // 預設為草稿
      if (!options.medium.draft && !options.medium.publish) {
        options.medium.draft = true;
      }
    }

    // Substack 選項
    if (platform === 'substack') {
      const methodArg = args.find(arg => arg.startsWith('--substack:method='));
      options.substack.method = methodArg ? methodArg.split('=')[1] : 'manual';
    }
  });

  return {
    articlePath,
    platforms,
    options
  };
}

// CLI 執行
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const parsed = parseArgs(args);

  if (!parsed) {
    console.error('❌ 參數錯誤。使用 --help 查看說明。\n');
    showUsage();
    process.exit(1);
  }

  publishToPlatforms(parsed.articlePath, parsed.platforms, parsed.options)
    .then(results => {
      const allSuccess = Object.values(results).every(r => r.success);
      process.exit(allSuccess ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ 發佈流程錯誤:', error);
      process.exit(1);
    });
}

module.exports = { publishToPlatforms, PLATFORMS };
