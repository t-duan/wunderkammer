import { useTranslation } from 'react-i18next';
import type { POIBase } from '../types';
import { pois } from '../data/pois';
import POICard from './POICard';

interface POIListProps {
  onPOIClick: (poi: POIBase) => void;
}

export default function POIList({ onPOIClick }: POIListProps) {
  const { t } = useTranslation();

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100%' }}>
      <h2
        style={{
          padding: '16px 12px 8px',
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--color-trollingerblau)',
        }}
      >
        {t('pois_title')}
      </h2>
      <div>
        {pois.map((poi) => (
          <POICard key={poi.id} poi={poi} onClick={onPOIClick} />
        ))}
      </div>
    </div>
  );
}
