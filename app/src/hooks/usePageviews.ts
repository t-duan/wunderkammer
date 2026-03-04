import { useState, useEffect } from 'react';
import type { PageviewStats } from '../api/pageviews';
import { fetchPageviews } from '../api/pageviews';

export function usePageviews(article: string | null, lang: 'de' | 'en', days = 90) {
  const [stats, setStats] = useState<PageviewStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!article) {
      setStats(null);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPageviews(article, lang, days)
      .then((result) => {
        if (!cancelled) {
          setStats(result);
          if (!result) setError(`No data for "${article}" (${lang})`);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(String(err));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [article, lang, days]);

  return { stats, loading, error };
}
