import { useState, useEffect } from 'react';
import type { CommonsImage } from '../types';
import { fetchCommonsImages } from '../api/commons';

export function useCommons(category: string | null) {
  const [images, setImages] = useState<CommonsImage[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!category) {
      setImages([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchCommonsImages(category).then((result) => {
      if (!cancelled) {
        setImages(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [category]);

  return { images, loading };
}
