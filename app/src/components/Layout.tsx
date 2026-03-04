import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { ViewMode } from '../types';
import LanguageSwitch from './LanguageSwitch';

interface LayoutProps {
  children: ReactNode;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onBackClick?: () => void;
  showBack?: boolean;
}

export default function Layout({
  children,
  viewMode,
  onViewModeChange,
  onBackClick,
  showBack,
}: LayoutProps) {
  const { t } = useTranslation();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      {/* Header */}
      <header
        style={{
          background: 'var(--color-trollingerblau)',
          color: '#fff',
          display: 'flex',
          alignItems: 'center',
          padding: '8px 12px',
          gap: 8,
          minHeight: 52,
          zIndex: 1000,
        }}
      >
        {showBack && (
          <button
            onClick={onBackClick}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#fff',
              fontSize: 20,
              cursor: 'pointer',
              padding: '4px 8px',
            }}
            aria-label={t('back')}
          >
            ←
          </button>
        )}
        <img
          src="/logo-weiss.png"
          alt="Stiftung Friedenstein Gotha"
          style={{ height: 32, marginRight: 8 }}
        />
        <span
          style={{
            fontWeight: 700,
            fontSize: 16,
            flex: 1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {t('app_title')}
        </span>
        <LanguageSwitch />
      </header>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', position: 'relative' }}>
        {children}
      </main>

      {/* Bottom Navigation */}
      <nav
        style={{
          display: 'flex',
          borderTop: '1px solid #ddd',
          background: '#fff',
          zIndex: 1000,
        }}
      >
        <NavButton
          label={t('map')}
          icon="🗺"
          active={viewMode === 'map'}
          onClick={() => onViewModeChange('map')}
        />
        <NavButton
          label={t('list')}
          icon="☰"
          active={viewMode === 'list'}
          onClick={() => onViewModeChange('list')}
        />
      </nav>
    </div>
  );
}

function NavButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1,
        padding: '10px 0',
        border: 'none',
        background: active ? 'var(--color-seidengruen)' : '#fff',
        color: active ? '#fff' : 'var(--color-graphitschwarz)',
        fontFamily: 'var(--font-family)',
        fontWeight: active ? 700 : 400,
        fontSize: 13,
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2,
      }}
    >
      <span style={{ fontSize: 18 }}>{icon}</span>
      {label}
    </button>
  );
}
