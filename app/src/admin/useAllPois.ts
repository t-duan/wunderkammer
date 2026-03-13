import { useMemo } from 'react';
import type { POIBase } from '../types';
import { pois as staticPois } from '../data/pois';
import { useAdmin } from './useAdmin';

export function useAllPois(): POIBase[] {
  const { config } = useAdmin();
  return useMemo(
    () => [...staticPois, ...(config.customPois ?? [])],
    [config.customPois]
  );
}
