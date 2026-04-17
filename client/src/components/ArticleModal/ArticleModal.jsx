import { useState, useEffect } from 'react';
import './ArticleModal.css';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return '';
  }
}

export default function ArticleModal({ article, onClose, isBookmarked, onBookmark }) {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [heroImage, setHeroImage] = useState(article.urlToImage || '');

  useEffect(() => {
    let cancelled = false;

    async function fetchContent() {
      try {
        const res = await fetch(`/api/article?url=${encodeURIComponent(article.url)}`);
        const data = await res.json();
        if (!cancelled && data.content) {
          setContent(data.content);
          if (data.image) setHeroImage(data.image);
        }
      } catch {
        // fall through — will show description fallback
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchContent();

    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      cancelled = true;
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [article.url, onClose]);

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={article.title}
    >
      <div className="modal">
        <div className="modal-toolbar">
          <div className="modal-meta">
            {article.source?.name && (
              <span className="modal-source">{article.source.name}</span>
            )}
            {article.publishedAt && (
              <span className="modal-date">{formatDate(article.publishedAt)}</span>
            )}
          </div>
          <div className="modal-actions">
            <button
              className={`modal-action-btn${isBookmarked ? ' active' : ''}`}
              onClick={onBookmark}
              aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
              title={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" />
              </svg>
            </button>

            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="modal-action-btn"
              aria-label="Open original article"
              title="Open original"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>

            <button
              className="modal-action-btn"
              onClick={onClose}
              aria-label="Close article"
              title="Close"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        <div className="modal-body">
          <h2 className="modal-title">{article.title}</h2>
          {article.author && (
            <p className="modal-author">By {article.author}</p>
          )}

          {heroImage && (
            <div className="modal-image-wrap">
              <img
                src={heroImage}
                alt=""
                className="modal-image"
                onError={(e) => { e.target.closest('.modal-image-wrap').style.display = 'none'; }}
              />
            </div>
          )}

          {loading ? (
            <div className="modal-loading">
              <div className="modal-spinner" aria-hidden="true" />
              Loading article…
            </div>
          ) : content ? (
            <div className="modal-content">
              {content.split('\n\n').map((para, i) => (
                <p key={i}>{para}</p>
              ))}
            </div>
          ) : (
            <div className="modal-fallback">
              {article.description && <p className="modal-desc">{article.description}</p>}
              <a
                href={article.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary modal-read-btn"
              >
                Read Full Article →
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
