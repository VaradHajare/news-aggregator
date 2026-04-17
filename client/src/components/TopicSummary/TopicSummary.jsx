import './TopicSummary.css';

function renderSummary(summary, sources) {
  if (!summary) return null;
  const parts = summary.split(/(\[\d+\])/g);
  return parts.map((part, i) => {
    const match = part.match(/^\[(\d+)\]$/);
    if (match) {
      const num = parseInt(match[1], 10);
      const source = sources.find((s) => s.num === num);
      if (source) {
        return (
          <a
            key={i}
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="citation"
            title={`${source.title} — ${source.source}`}
          >
            {num}
          </a>
        );
      }
    }
    return <span key={i}>{part}</span>;
  });
}

export default function TopicSummary({ summary, sources, query, onClose }) {
  return (
    <div className="topic-summary">
      <div className="summary-header">
        <h2 className="summary-query">Summary: {query}</h2>
        <button className="summary-close-btn" onClick={onClose} aria-label="Close summary">
          <svg viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <div className="summary-body">
        <p className="summary-text">{renderSummary(summary, sources)}</p>
      </div>

      {sources.length > 0 && (
        <div className="sources-section">
          <h3 className="sources-title">Sources</h3>
          <ol className="sources-list">
            {sources.map((source) => (
              <li key={source.num} className="source-item">
                <div className="source-num">{source.num}</div>
                <div className="source-info">
                  <p className="source-article-title">{source.title}</p>
                  <p className="source-meta">{source.source}</p>
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-link"
                  >
                    Read article →
                  </a>
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="summary-actions">
        <button className="btn btn-secondary" onClick={onClose}>
          ← Back to news
        </button>
      </div>
    </div>
  );
}
