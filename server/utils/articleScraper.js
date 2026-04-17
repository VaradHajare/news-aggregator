import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';
const CONTENT_HINT = /(article|content|story|post|entry|main|body|text)/i;
const NOISE_HINT = /(comment|promo|ad-|advert|share|social|footer|header|sidebar|nav|menu)/i;
const PROMO_PATTERN = /(sign\s+up|subscribe|newsletter|premium\s+article|member\s+reward|full\s+access|exclusive\s+(feature|content)|get\s+all\s+the\s+top|your\s+business\s+needs\s+to\s+succeed)/i;

function cleanText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function normalizeUrl(src, baseUrl) {
  if (!src) return null;
  try {
    return new URL(src.trim(), baseUrl).href;
  } catch {
    return null;
  }
}

function extractImage($, baseUrl) {
  const candidates = [
    $('meta[property="og:image"]').attr('content'),
    $('meta[name="twitter:image"]').attr('content'),
    $('meta[property="twitter:image"]').attr('content'),
    $('meta[itemprop="image"]').attr('content'),
  ];

  for (const src of candidates) {
    const url = normalizeUrl(src, baseUrl);
    if (url) return url;
  }

  const articleImg = $('article img, main img').first().attr('src');
  const articleImgUrl = normalizeUrl(articleImg, baseUrl);
  if (articleImgUrl) return articleImgUrl;

  return null;
}

function scoreBlock($, el) {
  const classId = `${$(el).attr('class') || ''} ${$(el).attr('id') || ''}`;
  const paragraphs = $(el).find('p');
  let textLen = 0;
  paragraphs.each((_, p) => { textLen += $(p).text().trim().length; });

  const hintBonus = CONTENT_HINT.test(classId) ? 600 : 0;
  const noisePenalty = NOISE_HINT.test(classId) ? 800 : 0;
  return textLen + paragraphs.length * 120 + hintBonus - noisePenalty;
}

function extractContent($) {
  $('script, style, noscript, iframe, header, footer, nav, aside, form').remove();

  const mainNode = $('article, [role="main"], main').first();
  if (mainNode.length) {
    const paragraphs = [];
    mainNode.find('p, h2, h3').each((_, el) => {
      const text = cleanText($(el).text());
      if (text.length >= 40 && !PROMO_PATTERN.test(text)) paragraphs.push(text);
    });
    if (paragraphs.length >= 3) return paragraphs.join('\n\n');
  }

  let bestText = '';
  let bestScore = 0;

  $('div, section').each((_, el) => {
    const score = scoreBlock($, el);
    if (score <= bestScore) return;

    const paragraphs = [];
    $(el).find('p').each((_, p) => {
      const text = cleanText($(p).text());
      if (text.length >= 40 && !PROMO_PATTERN.test(text)) paragraphs.push(text);
    });

    if (paragraphs.length >= 3) {
      bestScore = score;
      bestText = paragraphs.join('\n\n');
    }
  });

  if (bestText) return bestText;

  const paragraphs = [];
  $('p').each((_, el) => {
    const text = cleanText($(el).text());
    if (text.length >= 40 && !PROMO_PATTERN.test(text)) paragraphs.push(text);
  });
  return paragraphs.join('\n\n');
}

export async function fetchArticleData(url) {
  try {
    const res = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': USER_AGENT,
        Accept: 'text/html,application/xhtml+xml',
      },
    });

    const contentType = res.headers['content-type'] || '';
    if (!contentType.includes('html')) return null;

    const $ = cheerio.load(res.data);
    const image = extractImage($, url);
    const text = extractContent($);

    if (!text || text.split(/\s+/).filter(Boolean).length < 50) return null;

    return { text, imageUrl: image || '' };
  } catch {
    return null;
  }
}
