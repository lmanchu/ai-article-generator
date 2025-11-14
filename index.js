#!/usr/bin/env node

/**
 * Article Generator - Main Entry Point
 * 互動式科技新聞文章生成器
 */

const readline = require('readline');
const { aggregateNews } = require('./news-aggregator');
const { generateNewsArticle } = require('./article-generator');
const { execSync } = require('child_process');

// 建立 readline 介面
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * 顯示歡迎訊息
 */
function showWelcome() {
  console.clear();
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║                                                            ║');
  console.log('║       📝  Lman 風格科技新聞文章生成器  📝                   ║');
  console.log('║                                                            ║');
  console.log('║   基於 204 篇 Medium 文章分析 (2015-2025)                  ║');
  console.log('║   自動抓取 Hacker News，生成 Lman 風格評論文章              ║');
  console.log('║                                                            ║');
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('\n');
}

/**
 * 顯示新聞列表並讓用戶選擇
 */
function displayNewsAndPrompt(newsList) {
  console.log('📋 以下是今日相關科技新聞 (按相關度排序):\n');

  newsList.forEach(news => {
    console.log(`${news.index}. ${news.display}`);
    console.log(`   來源: ${news.source} | HN 熱度: ${news.score} 分 | 留言數: ${news.comments}`);
    console.log(`   ${news.url}`);
    console.log('');
  });

  console.log('─'.repeat(60));
  console.log('\n💡 提示:');
  console.log('  - 🔥 [8-10/10]: 高度相關 (AI, 創業, 隱私)');
  console.log('  - ⭐ [6-7/10]:  中度相關 (區塊鏈, IoT)');
  console.log('  - ✨ [4-5/10]:  低度相關 (一般科技)');
  console.log('');
}

/**
 * 取得用戶選擇
 */
function getUserChoice(maxIndex) {
  return new Promise((resolve) => {
    rl.question(`\n請選擇要撰寫文章的新聞 (1-${maxIndex}，或輸入 'q' 退出): `, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * 確認是否生成
 */
function confirmGeneration(newsItem) {
  return new Promise((resolve) => {
    console.log('\n' + '═'.repeat(60));
    console.log('📰 你選擇的新聞:');
    console.log(`   ${newsItem.title}`);
    console.log(`   來源: ${newsItem.source}`);
    console.log(`   相關度: ${newsItem.relevance}/10`);
    console.log('═'.repeat(60));

    rl.question('\n是否要生成文章？(y/n): ', (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * 詢問是否繼續
 */
function askContinue() {
  return new Promise((resolve) => {
    rl.question('\n是否要選擇其他新聞繼續生成？(y/n): ', (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * 顯示生成結果並詢問是否開啟檔案
 */
function showResultAndAskOpen(result) {
  return new Promise((resolve) => {
    if (result.success) {
      console.log('\n' + '═'.repeat(60));
      console.log('✨ 文章生成成功！');
      console.log('═'.repeat(60));
      console.log('\n📄 文章預覽 (前 500 字):\n');
      console.log(result.article.substring(0, 500) + '...\n');
      console.log('─'.repeat(60));
      console.log(`💾 完整文章已儲存至: ${result.filepath}`);

      rl.question('\n是否要開啟文章檔案？(y/n): ', (answer) => {
        if (answer.toLowerCase() === 'y') {
          try {
            execSync(`open "${result.filepath}"`);
            console.log('✅ 已開啟文章');
          } catch (error) {
            console.log(`⚠️  無法自動開啟，請手動查看: ${result.filepath}`);
          }
        }
        resolve();
      });
    } else {
      console.log('\n❌ 文章生成失敗:', result.error);
      resolve();
    }
  });
}

/**
 * 主流程
 */
async function main() {
  showWelcome();

  try {
    // 1. 抓取新聞
    console.log('🔍 正在抓取最新科技新聞...\n');
    const newsList = await aggregateNews();

    if (newsList.length === 0) {
      console.log('❌ 沒有找到相關新聞，請稍後再試。');
      rl.close();
      return;
    }

    let continueLoop = true;

    while (continueLoop) {
      // 2. 顯示新聞列表
      displayNewsAndPrompt(newsList);

      // 3. 取得用戶選擇
      const choice = await getUserChoice(newsList.length);

      // 檢查是否退出
      if (choice === 'q' || choice === 'Q') {
        console.log('\n👋 再見！');
        break;
      }

      // 驗證輸入
      const choiceNum = parseInt(choice);
      if (isNaN(choiceNum) || choiceNum < 1 || choiceNum > newsList.length) {
        console.log('\n❌ 無效的選擇，請重新輸入。');
        continue;
      }

      // 4. 確認選擇
      const selectedNews = newsList[choiceNum - 1];
      const confirmed = await confirmGeneration(selectedNews);

      if (!confirmed) {
        console.log('\n已取消。');
        continueLoop = await askContinue();
        continue;
      }

      // 5. 生成文章
      console.log('\n🚀 開始生成文章，請稍候 (約 1-2 分鐘)...\n');
      const result = await generateNewsArticle(selectedNews);

      // 6. 顯示結果
      await showResultAndAskOpen(result);

      // 7. 詢問是否繼續
      continueLoop = await askContinue();
    }

  } catch (error) {
    console.error('\n❌ 發生錯誤:', error.message);
  } finally {
    rl.close();
  }
}

// 處理 Ctrl+C
process.on('SIGINT', () => {
  console.log('\n\n👋 程式已中斷');
  rl.close();
  process.exit(0);
});

// 執行主程式
if (require.main === module) {
  main();
}

module.exports = { main };
