import { Router } from 'express';
import { fetchArticleData } from '../utils/articleScraper.js';

const router = Router();

router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  try {
    const data = await fetchArticleData(url);
    if (!data) return res.status(500).json({ error: 'Could not extract article content' });
    res.json({ content: data.text, image: data.imageUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
