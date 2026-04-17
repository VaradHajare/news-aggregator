import './NewsCard.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function NewsCard({ article, featured, onClick, onBookmark, bookmarked }) {
  const { title, description, urlToImage, source, publishedAt, author } = article;

  return (
    <div className={`news-card-wrap${featured ? ' featured' : ''}`}>
      <article
        className="news-card"
        onClick={onClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onClick()}
        aria-label={`Read: ${title}`}
      >
        {urlToImage && (
          <div className="card-image-wrap">
            <img
              src={urlToImage}
              alt=""
              className="card-image"
              loading="lazy"
              onError={(e) => { e.target.closest('.card-image-wrap').style.display = 'none'; }}
            />
          </div>
        )}

        <div className="card-inner">
          <div className="card-meta">
            <span className="card-source">{source?.name || 'Unknown'}</span>
            {publishedAt && (
              <span className="card-date">{formatDate(publishedAt)}</span>
            )}
          </div>

          <h3 className="card-title">{title}</h3>

          {description && (
            <p className="card-desc">{description}</p>
          )}

          <div className="card-footer">
            {author ? (
              <span className="card-author">By {author.split(',')[0]}</span>
            ) : (
              <span />
            )}
            <button
              className={`bookmark-btn${bookmarked ? ' active' : ''}`}
              onClick={(e) => { e.stopPropagation(); onBookmark(); }}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark article'}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" />
              </svg>
            </button>
          </div>
        </div>
      </article>
    </div>
  );
}
