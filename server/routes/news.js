import { Router } from 'express';
import { getLatestNews, searchNews } from '../utils/newsApi.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { query } = req.query;
    const articles = query ? await searchNews(query) : await getLatestNews();
    res.json({ articles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
