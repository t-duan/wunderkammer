import { cacheGet, cacheSet } from './cache';

export interface PageviewDay {
  date: string;    // YYYY-MM-DD
  views: number;
}

export interface PageviewStats {
  daily: PageviewDay[];
  total: number;
  avg: number;
}

function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}${m}${day}`;
}

/**
 * Fetch daily pageview stats for a Wikipedia article over the last N days.
 */
export async function fetchPageviews(
  article: string,
  lang: 'de' | 'en',
  days = 90
): Promise<PageviewStats | null> {
  const cacheKey = `pv_${lang}_${article}_${days}`;
  const cached = cacheGet<PageviewStats>(cacheKey, 24 * 60 * 60 * 1000); // 1 day TTL
  if (cached) return cached;

  // End date = yesterday (today's data is often not yet available)
  const end = new Date();
  end.setDate(end.getDate() - 1);
  const start = new Date();
  start.setDate(start.getDate() - days);

  const project = `${lang}.wikipedia.org`;

  // The pageviews API expects article titles with underscores, not encoded slashes/parens.
  // encodeURIComponent would double-encode underscores already present.
  // The API uses path segments, so we only need to encode characters that break URLs.
  const safeArticle = article.replace(/ /g, '_');

  const url =
    `https://wikimedia.org/api/rest_v1/metrics/pageviews/per-article/` +
    `${project}/all-access/user/${encodeURIComponent(safeArticle)}/daily/` +
    `${formatDate(start)}/${formatDate(end)}`;

  try {
    const res = await fetch(url, {
      headers: {
        'Api-User-Agent': 'WunderkammerGotha/0.1 (https://friedenstein.de)',
      },
    });
    if (!res.ok) {
      console.warn(`Pageviews API ${res.status} for ${safeArticle} (${lang})`);
      return null;
    }
    const data = await res.json();

    const items: Array<{ timestamp: string; views: number }> = data.items || [];
    if (items.length === 0) return null;

    const daily: PageviewDay[] = items.map((item) => ({
      date: `${item.timestamp.slice(0, 4)}-${item.timestamp.slice(4, 6)}-${item.timestamp.slice(6, 8)}`,
      views: item.views,
    }));

    const total = daily.reduce((sum, d) => sum + d.views, 0);
    const avg = daily.length > 0 ? Math.round(total / daily.length) : 0;

    const stats: PageviewStats = { daily, total, avg };
    cacheSet(cacheKey, stats);
    return stats;
  } catch (err) {
    console.warn('Pageviews fetch error:', err);
    return null;
  }
}
