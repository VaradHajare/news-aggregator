import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header/Header';
import NewsGrid from './components/NewsGrid/NewsGrid';
import ArticleModal from './components/ArticleModal/ArticleModal';
import Settings from './components/Settings/Settings';
import Collection from './components/Collection/Collection';
import TopicSummary from './components/TopicSummary/TopicSummary';
import { useSettings } from './hooks/useSettings';
import { useCollection } from './hooks/useCollection';
import './App.css';

const FONT_MAP = {
  cormorant: '"Cormorant Garamond", serif',
  playfair: '"Playfair Display", serif',
  spectral: '"Spectral", serif',
  lora: '"Lora", serif',
  merriweather: '"Merriweather", serif',
  ebgaramond: '"EB Garamond", serif',
  sourceserif: '"Source Serif 4", serif',
};

const FONT_SIZE_MAP = {
  small: '16px',
  medium: '18px',
  large: '20px',
};

export default function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [activePanel, setActivePanel] = useState(null); // 'settings' | 'collection' | null
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [topicSummary, setTopicSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const { settings, updateSetting } = useSettings();
  const { collection, addToCollection, removeFromCollection, isInCollection } = useCollection();

  const fetchNews = useCallback(async (searchQuery = '') => {
    setLoading(true);
    setError(null);
    setTopicSummary(null);
    try {
      const url = searchQuery
        ? `/api/news?query=${encodeURIComponent(searchQuery)}`
        : '/api/news';
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setArticles(data.articles || []);
    } catch {
      setError('Failed to load news. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchNews(); }, [fetchNews]);

  // Apply settings to <body> and CSS vars
  useEffect(() => {
    document.body.setAttribute('data-paper-tone', settings.paperTone);
    document.documentElement.style.setProperty(
      '--headline-font',
      FONT_MAP[settings.headlineFont] || FONT_MAP.cormorant,
    );
    document.documentElement.style.fontSize =
      FONT_SIZE_MAP[settings.fontSize] || FONT_SIZE_MAP.medium;
  }, [settings]);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    fetchNews(searchQuery);
  };

  const handleSummarizeTopic = async (searchQuery) => {
    setSummaryLoading(true);
    setTopicSummary(null);
    setArticles([]);
    setQuery(searchQuery);
    try {
      const res = await fetch(`/api/summarize?query=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setTopicSummary({ ...data, query: searchQuery });
    } catch {
      setError('Failed to generate summary. Please try again.');
    } finally {
      setSummaryLoading(false);
    }
  };

  const handleBookmark = (article) => {
    if (isInCollection(article.url)) {
      removeFromCollection(article.url);
    } else {
      addToCollection(article);
    }
  };

  const togglePanel = (panel) => {
    setActivePanel((prev) => (prev === panel ? null : panel));
  };

  return (
    <>
      <Header
        onSearch={handleSearch}
        onSummarizeTopic={handleSummarizeTopic}
        onToggleSettings={() => togglePanel('settings')}
        onToggleCollection={() => togglePanel('collection')}
        collectionCount={collection.length}
        isSettingsOpen={activePanel === 'settings'}
        isCollectionOpen={activePanel === 'collection'}
      />

      <div className="page-shell">
        {summaryLoading && (
          <div className="state-message">Generating summary…</div>
        )}

        {topicSummary && !summaryLoading && (
          <TopicSummary
            summary={topicSummary.summary}
            sources={topicSummary.sources}
            query={topicSummary.query}
            onClose={() => { setTopicSummary(null); fetchNews(); }}
          />
        )}

        {!topicSummary && !summaryLoading && (
          <NewsGrid
            articles={articles}
            loading={loading}
            error={error}
            query={query}
            onArticleClick={setSelectedArticle}
            onBookmark={handleBookmark}
            isBookmarked={(url) => isInCollection(url)}
          />
        )}
      </div>

      {selectedArticle && (
        <ArticleModal
          article={selectedArticle}
          onClose={() => setSelectedArticle(null)}
          isBookmarked={isInCollection(selectedArticle.url)}
          onBookmark={() => handleBookmark(selectedArticle)}
        />
      )}

      {activePanel === 'settings' && (
        <Settings
          settings={settings}
          onUpdate={updateSetting}
          onClose={() => setActivePanel(null)}
        />
      )}

      {activePanel === 'collection' && (
        <Collection
          collection={collection}
          onRemove={removeFromCollection}
          onArticleClick={(article) => setSelectedArticle(article)}
          onClose={() => setActivePanel(null)}
        />
      )}
    </>
  );
}
