import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import newsRouter from './routes/news.js';
import articleRouter from './routes/article.js';
import summarizeRouter from './routes/summarize.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/news', newsRouter);
app.use('/api/article', articleRouter);
app.use('/api/summarize', summarizeRouter);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
