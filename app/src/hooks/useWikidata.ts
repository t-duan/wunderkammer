import { useState, useEffect } from 'react';
import type { WikidataEntity } from '../types';
import { fetchWikidataEntity } from '../api/wikidata';

export function useWikidata(entityId: string | null) {
  const [data, setData] = useState<WikidataEntity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWikidataEntity(entityId).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [entityId]);

  return { data, loading };
}
