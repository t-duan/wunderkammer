import { useState, useCallback, useEffect } from 'react';
import type { POIBase, ViewMode } from './types';
import { pois } from './data/pois';
import Layout from './components/Layout';
import MapView from './components/MapView';
import POIList from './components/POIList';
import POIDetail from './components/POIDetail';

function getStateFromHash(): { poi: POIBase | null; view: ViewMode } {
  const hash = window.location.hash;
  const poiMatch = hash.match(/^#\/poi\/(.+)$/);
  if (poiMatch) {
    const slug = decodeURIComponent(poiMatch[1]);
    const found = pois.find((p) => p.slug === slug);
    if (found) return { poi: found, view: 'map' };
  }
  if (hash === '#/list') return { poi: null, view: 'list' };
  return { poi: null, view: 'map' };
}

export default function App() {
  const initial = getStateFromHash();
  const [viewMode, setViewMode] = useState<ViewMode>(initial.view);
  const [selectedPOI, setSelectedPOI] = useState<POIBase | null>(initial.poi);

  // Sync hash -> state on popstate (browser back/forward)
  useEffect(() => {
    const onHashChange = () => {
      const { poi, view } = getStateFromHash();
      setSelectedPOI(poi);
      setViewMode(view);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handlePOIClick = useCallback((poi: POIBase) => {
    setSelectedPOI(poi);
    window.location.hash = `/poi/${poi.slug}`;
  }, []);

  const handleBack = useCallback(() => {
    setSelectedPOI(null);
    window.location.hash = viewMode === 'list' ? '/list' : '/';
  }, [viewMode]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setSelectedPOI(null);
    setViewMode(mode);
    window.location.hash = mode === 'list' ? '/list' : '/';
  }, []);

  return (
    <Layout
      viewMode={viewMode}
      onViewModeChange={handleViewModeChange}
      showBack={!!selectedPOI}
      onBackClick={handleBack}
    >
      {selectedPOI ? (
        <POIDetail poi={selectedPOI} />
      ) : viewMode === 'map' ? (
        <MapView activePOI={null} onPOIClick={handlePOIClick} />
      ) : (
        <POIList onPOIClick={handlePOIClick} />
      )}
    </Layout>
  );
}
