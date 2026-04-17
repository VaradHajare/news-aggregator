# The Daily Stack

A modern, newspaper-styled news aggregation platform that fetches tech news from multiple trusted sources, scrapes full article content, and generates multi-source summaries with inline citations — all without any ML model dependencies.

## Features

- **Multi-Source Aggregation** — Pulls headlines simultaneously from NewsAPI and GNews API, deduplicates by URL, and merges results from trusted tech outlets (TechCrunch, The Verge, Ars Technica, Wired, ZDNet, and more)
- **Topic Search** — Search any keyword and get ranked results across both APIs
- **Topic Summary with Citations** — Scrapes up to 5 articles, scores sentences by relevance, and builds a readable summary with inline `[1]`, `[2]` … citation markers linked to their sources
- **Full Article Reader** — Click any card to open a modal that scrapes and renders the full article content; falls back to the description if the page is inaccessible
- **Promotional Content Filtering** — Strips newsletter sign-up prompts, subscription CTAs, and member-reward copy from scraped text before it reaches summaries
- **Bookmarks / Collection** — Save articles to a local collection panel, persisted in `localStorage`
- **Appearance Settings**
  - 7 headline fonts: Cormorant Garamond, Playfair Display, Spectral, Lora, Merriweather, EB Garamond, Source Serif 4
  - Font size: Small / Medium / Large (scales the entire UI)
  - Paper tone: Warm / Ivory / Newsprint / Slate
- **Keyboard Accessible** — Escape closes modals; article cards are keyboard-navigable

## Screenshots

### Top Headlines
<img width="822" height="847" alt="image" src="https://github.com/user-attachments/assets/f4c3fe37-367d-48a3-8430-6f6e463b9d12" />

### Topic Summary with Citations
<img width="814" height="885" alt="image" src="https://github.com/user-attachments/assets/52253d41-bd6e-4c10-972f-ad788b93e1fd" />

### Search Results
<img width="820" height="738" alt="image" src="https://github.com/user-attachments/assets/6c024310-8a85-4203-9aa4-985c2a843072" />

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite |
| Styling | CSS custom properties, Google Fonts |
| Backend | Node.js, Express.js (ES Modules) |
| News APIs | NewsAPI, GNews API |
| Web Scraping | Axios, Cheerio |
| Summarization | Custom sentence-scoring algorithm |
| Dev tooling | Nodemon, dotenv |

## Project Structure

```
news-aggregator-main/
├── client/                     # React frontend (Vite)
│   ├── index.html
│   └── src/
│       ├── App.jsx
│       ├── index.css
│       ├── hooks/
│       │   ├── useSettings.js  # Font, size, paper tone — persisted to localStorage
│       │   └── useCollection.js
│       └── components/
│           ├── Header/
│           ├── NewsCard/
│           ├── NewsGrid/
│           ├── ArticleModal/
│           ├── Settings/
│           ├── Collection/
│           └── TopicSummary/
└── server/                     # Express backend
    ├── index.js
    ├── routes/
    │   ├── news.js
    │   ├── article.js
    │   └── summarize.js
    └── utils/
        ├── newsApi.js          # NewsAPI + GNews dual-fetch and merge
        ├── articleScraper.js   # Cheerio-based content extraction
        └── summarize.js        # Sentence scoring and multi-source summary builder
```

## Installation

### Prerequisites

- Node.js 18+
- A free [NewsAPI](https://newsapi.org) key
- A free [GNews](https://gnews.io) key

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/VaradHajare/news-aggregator.git
   cd news-aggregator-main
   ```

2. **Set up environment variables**

   Create `server/.env`:
   ```
   NEWS_API_KEY=your_newsapi_key
   GNEWS_API_KEY=your_gnews_key
   PORT=5000
   ```

3. **Install dependencies**
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

4. **Start the backend**
   ```bash
   cd server
   npm run dev      # uses nodemon
   # or
   node index.js
   ```

5. **Start the frontend**
   ```bash
   cd client
   npm run dev
   ```

6. **Open in browser** — Navigate to `http://localhost:5173`

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/news` | GET | Top tech headlines (merged from both APIs) |
| `/api/news?query=...` | GET | Search articles by keyword |
| `/api/article?url=...` | GET | Scrape and return full article text |
| `/api/summarize?query=...` | GET | Multi-source summary with citations |

## License

MIT License — see [LICENSE](LICENSE) for details.

## Author

[Varad Hajare](https://github.com/VaradHajare)
