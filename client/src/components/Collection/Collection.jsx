import './Collection.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}

export default function Collection({ collection, onRemove, onArticleClick, onClose }) {
  return (
    <>
      <div className="panel-overlay" onClick={onClose} />
      <aside className="panel collection-panel">
        <div className="panel-header">
          <h2 className="panel-title">
            Saved
            {collection.length > 0 && (
              <span className="collection-count">{collection.length}</span>
            )}
          </h2>
          <button className="panel-close-btn" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="panel-body">
          {!collection.length ? (
            <p className="collection-empty">
              Bookmark articles using the ribbon icon to save them here.
            </p>
          ) : (
            <ul className="collection-list">
              {collection.map((article) => (
                <li key={article.url} className="collection-item">
                  <button
                    className="collection-item-btn"
                    onClick={() => { onArticleClick(article); onClose(); }}
                  >
                    <span className="collection-item-source">
                      {article.source?.name || article.source || 'Unknown'}
                    </span>
                    <span className="collection-item-title">{article.title}</span>
                    {article.publishedAt && (
                      <span className="collection-item-date">
                        {formatDate(article.publishedAt)}
                      </span>
                    )}
                  </button>
                  <button
                    className="collection-remove-btn"
                    onClick={() => onRemove(article.url)}
                    aria-label="Remove from saved"
                    title="Remove"
                  >
                    <svg viewBox="0 0 24 24">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>
    </>
  );
}
