#!/usr/bin/env node

/**
 * 檢查 Medium Integration Token 狀態
 * 協助用戶確認是否有可用的 token
 */

const { execSync } = require('child_process');

console.log('🔍 檢查 Medium Integration Token 狀態...\n');
console.log('═'.repeat(60));

// 檢查環境變數
if (process.env.MEDIUM_TOKEN) {
  console.log('✅ 找到 MEDIUM_TOKEN 環境變數');
  console.log(`   Token: ${process.env.MEDIUM_TOKEN.substring(0, 10)}...`);
  testToken(process.env.MEDIUM_TOKEN);
  process.exit(0);
}

// 檢查 Keychain
try {
  const token = execSync(
    'security find-generic-password -s "medium-integration-token" -w 2>/dev/null',
    { encoding: 'utf-8' }
  ).trim();

  if (token) {
    console.log('✅ 找到 Keychain 中的 Medium token');
    console.log(`   Token: ${token.substring(0, 10)}...`);
    testToken(token);
    process.exit(0);
  }
} catch (error) {
  // Keychain 中沒有
}

// 沒有找到 token
console.log('❌ 未找到 Medium Integration Token\n');
console.log('📝 請手動檢查:\n');
console.log('1. 開啟 Medium 設定頁面:');
console.log('   https://medium.com/me/settings/security\n');
console.log('2. 查看 "Integration tokens" 區塊\n');
console.log('3. 如果有現有的 token:');
console.log('   → 複製並執行以下命令儲存:');
console.log('   security add-generic-password -a "lmanchu" -s "medium-integration-token" -w "YOUR_TOKEN"\n');
console.log('4. 如果沒有 token（Medium 2025/1/1 後不再發放新 token）:');
console.log('   → 請使用 BrowserOS 自動化方案');
console.log('   → 執行: node publish-to-medium-browser.js <文章路徑>\n');
console.log('═'.repeat(60));

/**
 * 測試 token 是否有效
 */
function testToken(token) {
  console.log('\n🧪 測試 token 有效性...');

  try {
    const response = execSync(
      `curl -s -H "Authorization: Bearer ${token}" https://api.medium.com/v1/me`,
      { encoding: 'utf-8' }
    );

    const data = JSON.parse(response);

    if (data.errors) {
      console.log('❌ Token 無效或已過期');
      console.log(`   錯誤: ${JSON.stringify(data.errors)}\n`);
      console.log('💡 請使用 BrowserOS 自動化方案');
    } else if (data.data) {
      console.log('✅ Token 有效！\n');
      console.log('📊 帳號資訊:');
      console.log(`   ID: ${data.data.id}`);
      console.log(`   用戶名: ${data.data.username}`);
      console.log(`   姓名: ${data.data.name}`);
      console.log(`   連結: ${data.data.url}\n`);
      console.log('✨ 你可以使用 API 模式發佈:');
      console.log('   node publish-to-medium.js <文章路徑> --publish\n');
    }
  } catch (error) {
    console.log('❌ 測試失敗:', error.message);
  }

  console.log('═'.repeat(60));
}
