import { useState } from 'react';
import './Header.css';

export default function Header({
  onSearch,
  onSummarizeTopic,
  onToggleSettings,
  onToggleCollection,
  collectionCount,
  isSettingsOpen,
  isCollectionOpen,
}) {
  const [query, setQuery] = useState('');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  const handleSummarize = () => {
    if (query.trim()) onSummarizeTopic(query.trim());
  };

  const handleHomeClick = (e) => {
    e.preventDefault();
    setQuery('');
    onSearch('');
  };

  return (
    <header>
      <div className="header-inner">
        <div className="edition-bar">
          <span>{today}</span>
          <span>Tech &amp; AI Edition</span>
        </div>

        <div className="masthead-row">
          <h1>
            <a href="/" onClick={handleHomeClick}>The Daily Stack</a>
          </h1>
          <div className="header-tools">
            <button
              className={`utility-btn${isCollectionOpen ? ' is-active' : ''}`}
              onClick={onToggleCollection}
              aria-label="Saved articles"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M5 3h14a1 1 0 0 1 1 1v17l-8-4-8 4V4a1 1 0 0 1 1-1z" />
              </svg>
              <span>Saved</span>
              {collectionCount > 0 && (
                <span className="badge">{collectionCount}</span>
              )}
            </button>

            <button
              className={`utility-btn${isSettingsOpen ? ' is-active' : ''}`}
              onClick={onToggleSettings}
              aria-label="Settings"
            >
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
              <span>Settings</span>
            </button>
          </div>
        </div>

        <form className="search-row" onSubmit={handleSearch}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tech news…"
            aria-label="Search news"
          />
          <button type="submit" className="btn btn-primary">Search</button>
          <button type="button" className="btn btn-secondary" onClick={handleSummarize}>
            Summarize
          </button>
        </form>
      </div>
    </header>
  );
}
