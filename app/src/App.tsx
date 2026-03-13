import { useState, useCallback, useEffect } from 'react';
import type { POIBase, ViewMode } from './types';
import Layout from './components/Layout';
import MapView from './components/MapView';
import POIList from './components/POIList';
import POIDetail from './components/POIDetail';
import AdminDashboard from './admin/AdminDashboard';
import LoginPage from './admin/LoginPage';
import { useAuth } from './admin/useAuth';
import { useAdmin } from './admin/useAdmin';
import { useAllPois } from './admin/useAllPois';

function parseViewFromHash(): ViewMode | 'admin' {
  const hash = window.location.hash;
  if (hash === '#/admin' || hash.startsWith('#/admin/')) return 'admin';
  if (hash === '#/list') return 'list';
  return 'map';
}

function parseSlugFromHash(): string | null {
  const match = window.location.hash.match(/^#\/poi\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

export default function App() {
  const allPois = useAllPois();
  const [viewMode, setViewMode] = useState<ViewMode | 'admin'>(parseViewFromHash);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(parseSlugFromHash);
  const { isAuthenticated, loading: authLoading, logout } = useAuth();
  const { reloadConfig } = useAdmin();

  const selectedPOI = selectedSlug ? allPois.find((p) => p.slug === selectedSlug) ?? null : null;

  // Sync hash -> state on popstate (browser back/forward)
  useEffect(() => {
    const onHashChange = () => {
      setSelectedSlug(parseSlugFromHash());
      setViewMode(parseViewFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handlePOIClick = useCallback((poi: POIBase) => {
    setSelectedSlug(poi.slug);
    window.location.hash = `/poi/${poi.slug}`;
  }, []);

  const handleBack = useCallback(() => {
    setSelectedSlug(null);
    window.location.hash = viewMode === 'list' ? '/list' : '/';
  }, [viewMode]);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setSelectedSlug(null);
    setViewMode(mode);
    window.location.hash = mode === 'list' ? '/list' : '/';
  }, []);

  const handleAdminBack = useCallback(() => {
    // Reload config so public views reflect any admin changes
    reloadConfig();
    window.location.hash = '/';
  }, [reloadConfig]);

  const handleLogout = useCallback(async () => {
    await logout();
    window.location.hash = '/';
  }, [logout]);

  if (viewMode === 'admin') {
    if (authLoading) {
      return null;
    }
    if (!isAuthenticated) {
      return (
        <Layout
          viewMode="map"
          onViewModeChange={handleViewModeChange}
          showBack
          onBackClick={() => { window.location.hash = '/'; }}
        >
          <LoginPage />
        </Layout>
      );
    }
    return (
      <Layout
        viewMode="map"
        onViewModeChange={handleViewModeChange}
        showBack
        onBackClick={handleAdminBack}
      >
        <AdminHeader onLogout={handleLogout} />
        <AdminDashboard />
      </Layout>
    );
  }

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

function AdminHeader({ onLogout }: { onLogout: () => void }) {
  return (
    <div style={{
      background: 'var(--color-loungeviolett)',
      color: '#fff',
      padding: '6px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      fontSize: 12,
      fontWeight: 600,
    }}>
      <span>Admin</span>
      <button
        onClick={onLogout}
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#fff',
          padding: '4px 12px',
          borderRadius: 4,
          fontSize: 12,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Logout
      </button>
    </div>
  );
}
