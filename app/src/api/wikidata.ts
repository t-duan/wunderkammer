import type { WikidataEntity } from '../types';
import { cacheGet, cacheSet } from './cache';

export async function fetchWikidataEntity(
  entityId: string
): Promise<WikidataEntity | null> {
  const cacheKey = `wd_${entityId}`;
  const cached = cacheGet<WikidataEntity>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const entity = data.entities?.[entityId] as WikidataEntity | undefined;
    if (!entity) return null;
    cacheSet(cacheKey, entity);
    return entity;
  } catch {
    return null;
  }
}

export function getWikidataImageName(entity: WikidataEntity): string | null {
  const claims = entity.claims?.['P18'];
  if (!claims?.[0]?.mainsnak?.datavalue) return null;
  return claims[0].mainsnak.datavalue.value as string;
}

export function getWikidataWebsite(entity: WikidataEntity): string | null {
  const claims = entity.claims?.['P856'];
  if (!claims?.[0]?.mainsnak?.datavalue) return null;
  return claims[0].mainsnak.datavalue.value as string;
}

/**
 * Batch-fetch labels for a list of entity IDs from Wikidata.
 * Returns a map of ID -> label string.
 */
export async function fetchWikidataLabels(
  ids: string[],
  lang = 'de'
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const cacheKey = `wd_labels_${lang}_${ids.sort().join(',')}`;
  const cached = cacheGet<Record<string, string>>(cacheKey);
  if (cached) return cached;

  const result: Record<string, string> = {};

  // Wikidata allows up to 50 IDs per request
  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    try {
      const url =
        `https://www.wikidata.org/w/api.php?action=wbgetentities` +
        `&ids=${batch.join('|')}&props=labels&languages=${lang}|en&format=json&origin=*`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const entities = data.entities;
      if (!entities) continue;
      for (const [id, entity] of Object.entries(entities)) {
        const e = entity as { labels?: Record<string, { value: string }> };
        result[id] = e.labels?.[lang]?.value || e.labels?.en?.value || id;
      }
    } catch {
      // skip batch on error
    }
  }

  cacheSet(cacheKey, result);
  return result;
}

/**
 * Fetch labels for FactGrid entities (same Wikibase API, different host).
 */
export async function fetchFactGridLabels(
  ids: string[],
  lang = 'en'
): Promise<Record<string, string>> {
  if (ids.length === 0) return {};

  const cacheKey = `fg_labels_${lang}_${ids.sort().join(',')}`;
  const cached = cacheGet<Record<string, string>>(cacheKey);
  if (cached) return cached;

  const result: Record<string, string> = {};

  for (let i = 0; i < ids.length; i += 50) {
    const batch = ids.slice(i, i + 50);
    try {
      const url =
        `https://database.factgrid.de/w/api.php?action=wbgetentities` +
        `&ids=${batch.join('|')}&props=labels&languages=${lang}|en|de&format=json&origin=*`;
      const res = await fetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      const entities = data.entities;
      if (!entities) continue;
      for (const [id, entity] of Object.entries(entities)) {
        const e = entity as { labels?: Record<string, { value: string }> };
        result[id] = e.labels?.[lang]?.value || e.labels?.en?.value || e.labels?.de?.value || id;
      }
    } catch {
      // skip batch on error
    }
  }

  cacheSet(cacheKey, result);
  return result;
}
