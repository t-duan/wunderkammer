import { useState, useEffect } from 'react';
import type { WikipediaSummary } from '../types';
import { fetchWikipediaSummary } from '../api/wikipedia';

export function useWikipedia(title: string | null, lang: 'de' | 'en') {
  const [data, setData] = useState<WikipediaSummary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!title) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWikipediaSummary(title, lang).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [title, lang]);

  return { data, loading };
}
