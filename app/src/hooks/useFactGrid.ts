import { useState, useEffect } from 'react';
import type { FactGridEntity } from '../types';
import { fetchFactGridEntity } from '../api/factgrid';

export function useFactGrid(entityId: string | null) {
  const [data, setData] = useState<FactGridEntity | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!entityId) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchFactGridEntity(entityId).then((result) => {
      if (!cancelled) {
        setData(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [entityId]);

  return { data, loading };
}
