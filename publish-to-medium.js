#!/usr/bin/env node

/**
 * Publish to Medium
 * 自動發佈文章到 Medium
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * 讀取環境變數中的 Medium Token
 */
function getMediumToken() {
  // 優先從環境變數讀取
  if (process.env.MEDIUM_TOKEN) {
    return process.env.MEDIUM_TOKEN;
  }

  // 從 macOS Keychain 讀取
  try {
    const token = execSync(
      'security find-generic-password -s "medium-integration-token" -w 2>/dev/null',
      { encoding: 'utf-8' }
    ).trim();
    if (token) return token;
  } catch (error) {
    // Keychain 中找不到
  }

  throw new Error('找不到 Medium Token。請設定環境變數 MEDIUM_TOKEN 或儲存到 Keychain。');
}

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
 * 提取標籤（從文章內容或 frontmatter）
 */
function extractTags(metadata, content) {
  const tags = [];

  // 從 frontmatter 提取
  if (metadata.tags) {
    const tagList = metadata.tags.replace(/[\[\]]/g, '').split(',');
    tags.push(...tagList.map(t => t.trim()));
  }

  // 從內容提取關鍵詞
  const keywords = ['AI', 'Blockchain', 'Web3', 'Startup', 'IoT', 'Product Management'];
  keywords.forEach(keyword => {
    if (content.includes(keyword) && !tags.includes(keyword)) {
      tags.push(keyword);
    }
  });

  // Medium 限制最多 5 個標籤
  return tags.slice(0, 5);
}

/**
 * 取得 Medium 使用者 ID
 */
async function getMediumUserId(token) {
  const response = execSync(
    `curl -s -H "Authorization: Bearer ${token}" https://api.medium.com/v1/me`,
    { encoding: 'utf-8' }
  );

  const data = JSON.parse(response);
  if (data.errors) {
    throw new Error(`Medium API 錯誤: ${JSON.stringify(data.errors)}`);
  }

  return data.data.id;
}

/**
 * 發佈文章到 Medium
 */
async function publishToMedium(articlePath, options = {}) {
  try {
    console.log('📰 開始發佈到 Medium...\n');

    // 1. 取得 Token
    const token = getMediumToken();
    console.log('✅ Medium Token 已取得');

    // 2. 讀取文章
    if (!fs.existsSync(articlePath)) {
      throw new Error(`文章檔案不存在: ${articlePath}`);
    }

    const content = fs.readFileSync(articlePath, 'utf-8');
    const { metadata, content: body } = parseFrontmatter(content);
    console.log('✅ 文章已讀取');

    // 3. 取得使用者 ID
    const userId = await getMediumUserId(token);
    console.log(`✅ Medium User ID: ${userId}`);

    // 4. 準備發佈資料
    const title = metadata.title || body.split('\n')[0].replace(/^#\s*/, '');
    const tags = extractTags(metadata, body);
    const publishStatus = options.draft ? 'draft' : (options.publish ? 'public' : 'draft');

    const postData = {
      title: title,
      contentFormat: 'markdown',
      content: body,
      tags: tags,
      publishStatus: publishStatus,
      notifyFollowers: options.notify !== false
    };

    console.log('\n📝 發佈資訊:');
    console.log(`   標題: ${title}`);
    console.log(`   標籤: ${tags.join(', ')}`);
    console.log(`   狀態: ${publishStatus}`);
    console.log(`   通知追蹤者: ${postData.notifyFollowers ? '是' : '否'}\n`);

    // 5. 發佈到 Medium
    const curlCmd = `curl -s -X POST "https://api.medium.com/v1/users/${userId}/posts" \
      -H "Authorization: Bearer ${token}" \
      -H "Content-Type: application/json" \
      -d '${JSON.stringify(postData).replace(/'/g, "'\\''")}'`;

    const response = execSync(curlCmd, { encoding: 'utf-8' });
    const result = JSON.parse(response);

    if (result.errors) {
      throw new Error(`Medium API 錯誤: ${JSON.stringify(result.errors)}`);
    }

    // 6. 成功
    const post = result.data;
    console.log('✅ 文章已成功發佈到 Medium！\n');
    console.log('═'.repeat(60));
    console.log(`📰 標題: ${post.title}`);
    console.log(`🔗 連結: ${post.url}`);
    console.log(`📊 狀態: ${post.publishStatus}`);
    console.log(`📅 發佈時間: ${new Date(post.publishedAt).toLocaleString('zh-TW')}`);
    console.log('═'.repeat(60));

    // 7. 更新文章 frontmatter
    updateArticleMetadata(articlePath, {
      status: 'published',
      published_url: post.url,
      platform: 'medium',
      published_at: post.publishedAt
    });

    return {
      success: true,
      url: post.url,
      id: post.id,
      publishStatus: post.publishStatus
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
 * 更新文章的 metadata
 */
function updateArticleMetadata(articlePath, updates) {
  try {
    const content = fs.readFileSync(articlePath, 'utf-8');
    const { metadata, content: body } = parseFrontmatter(content);

    // 更新 metadata
    Object.assign(metadata, updates);

    // 重新組合
    const frontmatterLines = Object.entries(metadata).map(([key, value]) => {
      return `${key}: ${value}`;
    });

    const newContent = `---
${frontmatterLines.join('\n')}
---

${body}`;

    fs.writeFileSync(articlePath, newContent, 'utf-8');
    console.log('\n✅ 文章 metadata 已更新');

  } catch (error) {
    console.warn('⚠️  更新 metadata 失敗:', error.message);
  }
}

/**
 * 顯示使用說明
 */
function showUsage() {
  console.log(`
📰 Medium 自動發佈工具

用法:
  node publish-to-medium.js <文章路徑> [選項]

選項:
  --draft         發佈為草稿（預設）
  --publish       直接發佈為公開文章
  --no-notify     不通知追蹤者

範例:
  # 發佈為草稿
  node publish-to-medium.js generated/article.md --draft

  # 直接公開發佈
  node publish-to-medium.js generated/article.md --publish

  # 發佈但不通知追蹤者
  node publish-to-medium.js generated/article.md --publish --no-notify

設定 Medium Token:
  # 方法 1: 環境變數
  export MEDIUM_TOKEN="your_integration_token"

  # 方法 2: 儲存到 Keychain（推薦）
  security add-generic-password -a "lmanchu" -s "medium-integration-token" -w "your_token"

取得 Medium Integration Token:
  1. 前往 https://medium.com/me/settings/security
  2. 在 "Integration tokens" 區塊產生新 token
  3. 複製 token 並依上述方式儲存
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
  const options = {
    draft: args.includes('--draft'),
    publish: args.includes('--publish'),
    notify: !args.includes('--no-notify')
  };

  // 如果沒指定 --draft 或 --publish，預設為 draft
  if (!options.draft && !options.publish) {
    options.draft = true;
  }

  publishToMedium(articlePath, options)
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

module.exports = { publishToMedium };
