import { useTranslation } from 'react-i18next';
import { useFactGrid } from '../hooks/useFactGrid';

interface FactGridInfoProps {
  entityId: string | null;
}

export default function FactGridInfo({ entityId }: FactGridInfoProps) {
  const { t, i18n } = useTranslation();
  const { data, loading } = useFactGrid(entityId);

  if (!entityId || (!data && !loading)) return null;

  const lang = i18n.language;
  const label = data?.labels?.[lang]?.value || data?.labels?.en?.value || data?.labels?.de?.value;
  const description =
    data?.descriptions?.[lang]?.value ||
    data?.descriptions?.en?.value ||
    data?.descriptions?.de?.value;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        background: '#f8f6ff',
        borderRadius: 8,
        borderLeft: `4px solid var(--color-loungeviolett)`,
      }}
    >
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--color-loungeviolett)',
          marginBottom: 6,
          marginTop: 0,
        }}
      >
        {t('factgrid_info')}
      </h3>
      {loading ? (
        <div style={{ color: '#999', fontSize: 14 }}>{t('loading')}</div>
      ) : (
        <>
          {label && (
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
              {label}
            </div>
          )}
          {description && (
            <div style={{ fontSize: 14, color: '#555', marginBottom: 8 }}>
              {description}
            </div>
          )}
          <a
            href={`https://database.factgrid.de/wiki/Item:${entityId}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: 'var(--color-loungeviolett)',
              fontWeight: 600,
            }}
          >
            {t('view_on_factgrid')} →
          </a>
        </>
      )}
    </div>
  );
}
