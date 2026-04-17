import { useState, useEffect } from 'react';

const DEFAULTS = {
  headlineFont: 'cormorant',
  paperTone: 'warm',
  fontSize: 'medium',
};

export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem('newsSettings');
      return stored ? { ...DEFAULTS, ...JSON.parse(stored) } : DEFAULTS;
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    localStorage.setItem('newsSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = (key, value) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return { settings, updateSetting };
}
