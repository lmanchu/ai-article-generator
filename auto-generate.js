#!/usr/bin/env node

/**
 * 自動文章生成器 - 非互動式版本
 * 直接指定新聞索引來生成文章
 */

const { aggregateNews } = require('./news-aggregator');
const { generateNewsArticle } = require('./article-generator');

async function autoGenerate(newsIndex) {
  try {
    console.log('🔍 正在抓取最新科技新聞...\n');
    const newsList = await aggregateNews();

    if (newsList.length === 0) {
      console.log('❌ 沒有找到相關新聞');
      return;
    }

    console.log(`📋 找到 ${newsList.length} 則相關新聞\n`);

    // 顯示所有新聞
    newsList.forEach(news => {
      console.log(`${news.index}. ${news.display}`);
      console.log(`   ${news.url}`);
      console.log('');
    });

    // 驗證索引
    if (newsIndex < 1 || newsIndex > newsList.length) {
      console.log(`❌ 無效的索引。請選擇 1-${newsList.length}`);
      return;
    }

    const selectedNews = newsList[newsIndex - 1];

    console.log('\n' + '═'.repeat(60));
    console.log('📰 已選擇新聞:');
    console.log(`   ${selectedNews.title}`);
    console.log(`   來源: ${selectedNews.source}`);
    console.log(`   相關度: ${selectedNews.relevance}/10`);
    console.log('═'.repeat(60));

    console.log('\n🚀 開始生成文章，請稍候 (約 1-2 分鐘)...\n');

    const result = await generateNewsArticle(selectedNews);

    if (result.success) {
      console.log('\n' + '═'.repeat(60));
      console.log('✨ 文章生成成功！');
      console.log('═'.repeat(60));
      console.log('\n📄 文章預覽 (前 800 字):\n');
      console.log(result.article.substring(0, 800) + '...\n');
      console.log('─'.repeat(60));
      console.log(`💾 完整文章已儲存至:\n   ${result.filepath}`);
      console.log('\n📊 統計資訊:');
      console.log(`   - 字數: ${result.article.length} 字`);
      console.log(`   - 預估閱讀時間: ${Math.ceil(result.article.length / 400)} 分鐘`);
    } else {
      console.log('\n❌ 文章生成失敗:', result.error);
    }

  } catch (error) {
    console.error('\n❌ 發生錯誤:', error.message);
    process.exit(1);
  }
}

// 取得命令列參數
const newsIndex = parseInt(process.argv[2]);

if (isNaN(newsIndex)) {
  console.log('用法: node auto-generate.js <新聞索引>');
  console.log('範例: node auto-generate.js 2');
  process.exit(1);
}

autoGenerate(newsIndex);
