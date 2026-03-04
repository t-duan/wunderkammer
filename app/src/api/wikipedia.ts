import type { WikipediaSummary } from '../types';
import { cacheGet, cacheSet } from './cache';

export async function fetchWikipediaSummary(
  title: string,
  lang: 'de' | 'en'
): Promise<WikipediaSummary | null> {
  const cacheKey = `wiki_${lang}_${title}`;
  const cached = cacheGet<WikipediaSummary>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const summary: WikipediaSummary = {
      title: data.title,
      extract: data.extract,
      thumbnail: data.thumbnail,
      content_urls: data.content_urls,
    };
    cacheSet(cacheKey, summary);
    return summary;
  } catch {
    return null;
  }
}
