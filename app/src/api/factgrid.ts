import type { FactGridEntity } from '../types';
import { cacheGet, cacheSet } from './cache';

export async function fetchFactGridEntity(
  entityId: string
): Promise<FactGridEntity | null> {
  const cacheKey = `fg_${entityId}`;
  const cached = cacheGet<FactGridEntity>(cacheKey);
  if (cached) return cached;

  try {
    const url = `https://database.factgrid.de/w/api.php?action=wbgetentities&ids=${entityId}&format=json&origin=*`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const entity = data.entities?.[entityId] as FactGridEntity | undefined;
    if (!entity) return null;
    cacheSet(cacheKey, entity);
    return entity;
  } catch {
    return null;
  }
}
