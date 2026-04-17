import NewsCard from '../NewsCard/NewsCard';
import './NewsGrid.css';

export default function NewsGrid({
  articles,
  loading,
  error,
  query,
  onArticleClick,
  onBookmark,
  isBookmarked,
}) {
  if (loading) {
    return (
      <div className="grid-state">
        <div className="grid-state-spinner" aria-hidden="true" />
        Loading latest news…
      </div>
    );
  }

  if (error) {
    return <div className="grid-state error">{error}</div>;
  }

  if (!articles.length) {
    return (
      <div className="grid-state">
        {query ? `No articles found for "${query}"` : 'No articles available'}
      </div>
    );
  }

  return (
    <section className="news-section">
      <div className="section-header">
        <h2 className="section-title">
          {query ? `Results for "${query}"` : 'Latest in Technology'}
        </h2>
        <span className="section-count">{articles.length} articles</span>
      </div>

      <div className="news-grid">
        {articles.map((article, index) => (
          <NewsCard
            key={article.url || index}
            article={article}
            featured={index === 0}
            onClick={() => onArticleClick(article)}
            onBookmark={() => onBookmark(article)}
            bookmarked={isBookmarked(article.url)}
          />
        ))}
      </div>
    </section>
  );
}
