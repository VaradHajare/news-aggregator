import { Router } from 'express';
import { searchNews } from '../utils/newsApi.js';
import { fetchArticleData } from '../utils/articleScraper.js';
import { collectSentences, getQueryTerms, buildMultiSourceSummary } from '../utils/summarize.js';

const router = Router();

router.get('/', async (req, res) => {
  const { query } = req.query;
  if (!query) return res.status(400).json({ error: 'No query provided' });

  try {
    const articles = await searchNews(query);
    if (!articles.length) {
      return res.json({ summary: 'No articles found for this topic.', sources: [] });
    }

    const queryTerms = getQueryTerms(query);
    const sources = [];
    const sourceEntries = [];

    for (const article of articles.slice(0, 10)) {
      if (sources.length >= 5) break;

      const articleData = article.url ? await fetchArticleData(article.url) : null;
      const text = articleData?.text || '';
      const description = article.description || '';

      let sentences = [];
      if (text && text.split(/\s+/).length > 50) {
        sentences = collectSentences(text, queryTerms, 2);
      }
      if (!sentences.length && description) {
        sentences = collectSentences(description, queryTerms, 1);
      }
      if (!sentences.length) continue;

      const num = sources.length + 1;
      const record = {
        num,
        title: article.title || 'Unknown Title',
        source: article.source?.name || 'Unknown Source',
        url: article.url,
      };
      sources.push(record);
      sourceEntries.push({ ...record, sentences });
    }

    if (!sourceEntries.length) {
      return res.json({ summary: 'Could not find relevant content for this topic.', sources });
    }

    const summary = buildMultiSourceSummary(
      query,
      sourceEntries,
      Math.min(5, sourceEntries.length + 1),
    );
    res.json({ summary, sources });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
