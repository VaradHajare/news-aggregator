# News Summarizer

A modern, AI-powered news aggregation and summarization platform that fetches news from multiple trusted sources and provides summaries with citations.

## Features

- **Multi-Source News Aggregation** - Fetches news from trusted sources including BBC, CNN, Reuters, TechCrunch, The Verge, Wired, and more
- **AI-Powered Summarization** - Uses DistilBART model to generate concise summaries of articles
- **Citations** - Summarize any topic with inline citations [1], [2] linking to source articles
- **Modern Dark UI** - Beautiful glassmorphism design with responsive grid layout
- **Article Reader** - Click any article to view full content in a modal popup
- **Dual API Integration** - Uses both NewsAPI and GNews API for comprehensive coverage

## Screenshots

### Top Headlines
<img width="1842" height="963" alt="NewsAnalyzer(Homepage)" src="https://github.com/user-attachments/assets/9b4bba87-6f1d-4438-ad2f-77020a39ab45" />
Browse the latest news from trusted sources in a beautiful card grid layout.

### Topic Summary with Citations
<img width="1842" height="965" alt="NewsAnalyzer(Summarizer)" src="https://github.com/user-attachments/assets/c50c924c-7493-49ca-b88c-99017957cc48" />
Get AI-generated summaries of any topic with inline citations and source links.

### Search Results
<img width="1828" height="952" alt="NewsAnalyzer(Search)" src="https://github.com/user-attachments/assets/ae3c016a-3937-4f76-83b0-5e9960c37f7d" />
Search for any topic and get relevant articles from multiple news sources.

## Tech Stack

- **Backend**: Django 4.0+
- **AI/ML**: Hugging Face Transformers (DistilBART)
- **Article Extraction**: Requests + BeautifulSoup + lxml
- **APIs**: NewsAPI, GNews API
- **Frontend**: HTML5, CSS3 (Glassmorphism), Vanilla JavaScript

## Project Structure

```
news-summarizer/
├── manage.py
├── requirements.txt
├── db.sqlite3
├── newsanalyzer/           # Django project settings
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── news/                   # Main application
    ├── views.py            # API endpoints & page rendering
    ├── utils.py            # News fetching & AI summarization
    ├── urls.py             # URL routing
    └── templates/
        └── news/
            └── home.html   # Frontend UI
```

## Installation

1. **Clone the Repository**:
   ```bash
   git clone https://github.com/VaradHajare/news-summarizer.git
   cd news-summarizer
   ```

2. **Set Up Virtual Environment**:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the Server**:
   ```bash
   python manage.py runserver
   ```

5. **Open in Browser**: Navigate to `http://localhost:8000`

## API Keys

The application uses two news APIs:

- **NewsAPI** - Already configured (free tier: 100 requests/day for development)
- **GNews API** - Get your free key at [gnews.io](https://gnews.io) and update `GNEWS_API_KEY` in `news/utils.py`

## Usage

### Browse Headlines
The homepage displays top headlines from trusted news sources in a responsive card grid.

### Search News
Enter a topic in the search bar and click "Search" to find related articles.

### Summarize Topic
Enter a topic and click "Summarize Topic" to get an AI-generated summary combining information from multiple sources, complete with inline citations and a references section.

### Read Articles
Click any article card to view the full article content in a popup modal.

## License

MIT License - See [LICENSE](LICENSE) for details.

## Author

[Varad Hajare](https://github.com/VaradHajare)
