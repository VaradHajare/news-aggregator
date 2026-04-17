import axios from 'axios';

const NEWS_API_KEY = process.env.NEWS_API_KEY;
const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const NEWS_API_BASE = 'https://newsapi.org/v2';
const GNEWS_BASE = 'https://gnews.io/api/v4';

const TRUSTED_SOURCE_IDS = [
  'ars-technica', 'techcrunch', 'the-verge', 'engadget',
  'techradar', 'hacker-news', 'the-hacker-news', 'game-spot',
];

const TECH_SOURCE_DOMAINS = [
  'arstechnica.com', 'techcrunch.com', 'theverge.com', 'engadget.com',
  'techradar.com', 'thehackernews.com', 'cybernews.com', 'gamespot.com',
  'bleepingcomputer.com', 'venturebeat.com', 'zdnet.com', 'tomshardware.com',
];

const TOPIC_QUERY = [
  '"artificial intelligence"', '"machine learning"', '"cybersecurity"',
  '"software engineering"', '"cloud computing"', '"data science"',
].join(' OR ');

function normalizeGNewsArticle(article) {
  return {
    title: article.title,
    description: article.description,
    url: article.url,
    urlToImage: article.image,
    source: { name: article.source?.name || 'Unknown' },
    publishedAt: article.publishedAt,
    author: null,
  };
}

async function safeGet(url, params) {
  try {
    const res = await axios.get(url, { params, timeout: 10000 });
    return res.data;
  } catch {
    return {};
  }
}

function mergeUnique(...groups) {
  const seen = new Set();
  const merged = [];
  for (const group of groups) {
    for (const article of (group || [])) {
      if (article.url && !seen.has(article.url)) {
        seen.add(article.url);
        merged.push(article);
      }
    }
  }
  return merged;
}

export async function getLatestNews(pageSize = 12) {
  const [sourceData, topicData, gnewsData] = await Promise.all([
    safeGet(`${NEWS_API_BASE}/top-headlines`, {
      sources: TRUSTED_SOURCE_IDS.join(','),
      apiKey: NEWS_API_KEY,
      pageSize,
    }),
    safeGet(`${NEWS_API_BASE}/everything`, {
      q: TOPIC_QUERY,
      sortBy: 'publishedAt',
      language: 'en',
      domains: TECH_SOURCE_DOMAINS.join(','),
      apiKey: NEWS_API_KEY,
      pageSize,
    }),
    safeGet(`${GNEWS_BASE}/search`, {
      q: TOPIC_QUERY,
      lang: 'en',
      max: pageSize,
      apikey: GNEWS_API_KEY,
    }),
  ]);

  const gnews = (gnewsData.articles || []).map(normalizeGNewsArticle);
  return mergeUnique(
    sourceData.articles || [],
    topicData.articles || [],
    gnews,
  ).slice(0, pageSize);
}

export async function searchNews(query, pageSize = 12) {
  const [newsapiData, gnewsData] = await Promise.all([
    safeGet(`${NEWS_API_BASE}/everything`, {
      q: query,
      sortBy: 'relevancy',
      domains: TECH_SOURCE_DOMAINS.join(','),
      apiKey: NEWS_API_KEY,
      pageSize,
      language: 'en',
    }),
    safeGet(`${GNEWS_BASE}/search`, {
      q: query,
      lang: 'en',
      max: pageSize,
      apikey: GNEWS_API_KEY,
    }),
  ]);

  const gnews = (gnewsData.articles || []).map(normalizeGNewsArticle);
  return mergeUnique(newsapiData.articles || [], gnews).slice(0, pageSize);
}
