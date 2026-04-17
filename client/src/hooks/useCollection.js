import { useState, useEffect } from 'react';

export function useCollection() {
  const [collection, setCollection] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('newsCollection') || '[]');
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem('newsCollection', JSON.stringify(collection));
  }, [collection]);

  const addToCollection = (article) => {
    setCollection((prev) => {
      if (prev.some((a) => a.url === article.url)) return prev;
      return [article, ...prev];
    });
  };

  const removeFromCollection = (url) => {
    setCollection((prev) => prev.filter((a) => a.url !== url));
  };

  const isInCollection = (url) => collection.some((a) => a.url === url);

  return { collection, addToCollection, removeFromCollection, isInCollection };
}
