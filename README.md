# News Aggregator

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
<img width="822" height="847" alt="image" src="https://github.com/user-attachments/assets/f4c3fe37-367d-48a3-8430-6f6e463b9d12" />

Browse the latest news from trusted sources in a beautiful card grid layout.

### Topic Summary with Citations
<img width="814" height="885" alt="image" src="https://github.com/user-attachments/assets/52253d41-bd6e-4c10-972f-ad788b93e1fd" />

Get AI-generated summaries of any topic with inline citations and source links.

### Search Results
<img width="820" height="738" alt="image" src="https://github.com/user-attachments/assets/6c024310-8a85-4203-9aa4-985c2a843072" />

Search for any topic and get relevant articles from multiple news sources.

## Tech Stack
Backend: Django
Database: SQLite
Frontend: Django Templates
Web Scraping: Requests, BeautifulSoup, lxml
Natural Language Processing: Transformers, PyTorch
Programming Language: Python

## Project Structure

```
news-summarizer-main\
├───manage.py
├───requirements.txt
├───news\
│   ├───models.py
│   ├───views.py
│   ├───urls.py
│   └───templates\
│       └───news\
│           └───home.html
└───newsanalyzer\
    ├───settings.py
    └───urls.py
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
