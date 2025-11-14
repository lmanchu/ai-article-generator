#!/usr/bin/env node

/**
 * News Aggregator
 * 從多個來源抓取科技/AI 新聞，並根據 Lman 興趣評分
 */

const { execSync } = require('child_process');
const config = require('./config');

/**
 * 從 Hacker News API 抓取熱門新聞
 */
async function fetchHackerNews() {
  console.log('📰 正在抓取 Hacker News...');

  try {
    // 抓取 Top Stories
    const topStoriesCmd = `curl -s 'https://hacker-news.firebaseio.com/v0/topstories.json'`;
    const topStories = JSON.parse(execSync(topStoriesCmd, { encoding: 'utf-8' }));

    // 只抓前 30 則
    const storyIds = topStories.slice(0, 30);
    const news = [];

    for (const id of storyIds) {
      try {
        const storyCmd = `curl -s 'https://hacker-news.firebaseio.com/v0/item/${id}.json'`;
        const story = JSON.parse(execSync(storyCmd, { encoding: 'utf-8' }));

        if (story && story.title && story.url) {
          news.push({
            id: `hn_${id}`,
            title: story.title,
            url: story.url,
            source: 'Hacker News',
            score: story.score || 0,
            comments: story.descendants || 0,
            time: story.time ? new Date(story.time * 1000) : new Date()
          });
        }
      } catch (error) {
        // Skip failed items
        continue;
      }
    }

    console.log(`✅ 從 Hacker News 抓取 ${news.length} 則新聞`);
    return news;

  } catch (error) {
    console.error('❌ Hacker News 抓取失敗:', error.message);
    return [];
  }
}

/**
 * 使用 WebFetch 從網站抓取新聞標題
 * (備用方案，如果需要從 TechCrunch 等網站抓取)
 */
async function fetchWebNews(url, sourceName) {
  console.log(`📰 正在抓取 ${sourceName}...`);

  // 這裡可以整合 Claude Code 的 WebFetch 工具
  // 或使用簡單的 curl + HTML parsing
  // 暫時返回空陣列，主要使用 HN
  console.log(`⏭️  ${sourceName} 抓取功能待實作 (可用 HN 為主)`);
  return [];
}

/**
 * 計算新聞相關度評分 (0-10)
 * 基於 Lman 的興趣領域關鍵詞
 */
function calculateRelevanceScore(newsItem) {
  const title = newsItem.title.toLowerCase();
  let score = 0;

  // 高優先級關鍵詞: +3 分
  const highKeywords = config.INTEREST_KEYWORDS.high;
  for (const keyword of highKeywords) {
    if (title.includes(keyword.toLowerCase())) {
      score += 3;
      break; // 同級關鍵詞只加一次
    }
  }

  // 中優先級關鍵詞: +2 分
  const mediumKeywords = config.INTEREST_KEYWORDS.medium;
  for (const keyword of mediumKeywords) {
    if (title.includes(keyword.toLowerCase())) {
      score += 2;
      break;
    }
  }

  // 低優先級關鍵詞: +1 分
  const lowKeywords = config.INTEREST_KEYWORDS.low;
  for (const keyword of lowKeywords) {
    if (title.includes(keyword.toLowerCase())) {
      score += 1;
      break;
    }
  }

  // 排除關鍵詞: -5 分
  const excludeKeywords = config.EXCLUDE_KEYWORDS;
  for (const keyword of excludeKeywords) {
    if (title.includes(keyword.toLowerCase())) {
      score -= 5;
      break;
    }
  }

  // HN 熱度加成 (高分新聞更可能有價值)
  if (newsItem.score && newsItem.score > 100) {
    score += 1;
  }
  if (newsItem.score && newsItem.score > 300) {
    score += 1;
  }

  // 確保評分在 0-10 之間
  return Math.max(0, Math.min(10, score));
}

/**
 * 過濾和排序新聞
 */
function filterAndSortNews(newsList) {
  // 計算每則新聞的相關度
  const newsWithRelevance = newsList.map(news => ({
    ...news,
    relevance: calculateRelevanceScore(news)
  }));

  // 過濾掉低相關度新聞
  const minScore = config.FETCH_CONFIG.min_relevance_score;
  const filtered = newsWithRelevance.filter(news => news.relevance >= minScore);

  // 按相關度和熱度排序
  const sorted = filtered.sort((a, b) => {
    // 優先按相關度排序
    if (b.relevance !== a.relevance) {
      return b.relevance - a.relevance;
    }
    // 相關度相同時按熱度排序
    return (b.score || 0) - (a.score || 0);
  });

  return sorted.slice(0, config.FETCH_CONFIG.max_news_items);
}

/**
 * 格式化新聞列表供顯示
 */
function formatNewsForDisplay(newsList) {
  return newsList.map((news, index) => {
    const relevanceEmoji = news.relevance >= 8 ? '🔥' :
                          news.relevance >= 6 ? '⭐' :
                          news.relevance >= 4 ? '✨' : '💡';

    return {
      index: index + 1,
      display: `${relevanceEmoji} [${news.relevance}/10] ${news.title}`,
      title: news.title,
      url: news.url,
      source: news.source,
      relevance: news.relevance,
      score: news.score || 0,
      comments: news.comments || 0
    };
  });
}

/**
 * 主函數：聚合所有新聞
 */
async function aggregateNews() {
  console.log('🚀 開始聚合科技新聞...\n');

  // 抓取 Hacker News
  const hnNews = await fetchHackerNews();

  // 未來可擴展其他來源
  // const tcNews = await fetchWebNews('https://techcrunch.com', 'TechCrunch');

  // 合併所有新聞
  const allNews = [...hnNews];

  console.log(`\n📊 總共抓取 ${allNews.length} 則新聞`);

  // 過濾和排序
  const relevantNews = filterAndSortNews(allNews);

  console.log(`✅ 篩選出 ${relevantNews.length} 則相關新聞\n`);

  // 格式化供顯示
  return formatNewsForDisplay(relevantNews);
}

module.exports = {
  aggregateNews,
  fetchHackerNews,
  calculateRelevanceScore
};

// CLI 測試
if (require.main === module) {
  aggregateNews().then(news => {
    console.log('📋 相關新聞列表:\n');
    news.forEach(item => {
      console.log(`${item.index}. ${item.display}`);
      console.log(`   來源: ${item.source} | 熱度: ${item.score} | 留言: ${item.comments}`);
      console.log(`   連結: ${item.url}\n`);
    });
  }).catch(error => {
    console.error('❌ 錯誤:', error);
    process.exit(1);
  });
}
