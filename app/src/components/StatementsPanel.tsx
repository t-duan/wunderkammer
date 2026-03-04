import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import type { WikidataClaim } from '../types';

interface StatementsPanelProps {
  claims: Record<string, WikidataClaim[]> | undefined;
  entityId: string;
  source: 'wikidata' | 'factgrid';
  accentColor: string;
  bgColor: string;
  title: string;
  fetchLabels: (ids: string[], lang: string) => Promise<Record<string, string>>;
}

const SKIP_DATATYPES = new Set(['commonsMedia', 'geo-shape', 'tabular-data', 'math']);

function isUrl(s: string): boolean {
  return s.startsWith('http://') || s.startsWith('https://');
}

function formatValue(
  datavalue: { value: unknown; type: string } | undefined,
  labels: Record<string, string>
): string | null {
  if (!datavalue) return null;

  switch (datavalue.type) {
    case 'wikibase-entityid': {
      const v = datavalue.value as { id?: string; 'numeric-id'?: number };
      const id = v.id || `Q${v['numeric-id']}`;
      return labels[id] || id;
    }
    case 'string':
      return datavalue.value as string;
    case 'monolingualtext': {
      const v = datavalue.value as { text: string; language: string };
      return v.text;
    }
    case 'time': {
      const v = datavalue.value as { time: string; precision: number };
      const match = v.time.match(/([+-]?\d+)-(\d{2})-(\d{2})/);
      if (!match) return v.time;
      const [, year, month, day] = match;
      const y = parseInt(year);
      if (v.precision <= 9) return `${Math.abs(y)}${y < 0 ? ' v. Chr.' : ''}`;
      if (v.precision === 10) return `${month}/${Math.abs(y)}`;
      return `${day}.${month}.${Math.abs(y)}`;
    }
    case 'quantity': {
      const v = datavalue.value as { amount: string; unit?: string };
      const amount = v.amount.replace(/^\+/, '');
      if (v.unit && v.unit !== '1') {
        const unitId = v.unit.split('/').pop() || '';
        const unitLabel = labels[unitId] || unitId;
        return `${amount} ${unitLabel}`;
      }
      return amount;
    }
    case 'globecoordinate': {
      const v = datavalue.value as { latitude: number; longitude: number };
      return `${v.latitude.toFixed(5)}, ${v.longitude.toFixed(5)}`;
    }
    default:
      if (typeof datavalue.value === 'string') return datavalue.value;
      return JSON.stringify(datavalue.value);
  }
}

function ValueDisplay({ value }: { value: string }) {
  if (isUrl(value)) {
    // Show domain only for long URLs
    let display = value;
    try {
      display = new URL(value).hostname + '...';
    } catch { /* keep full */ }
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          color: '#2563eb',
          wordBreak: 'break-all',
          fontSize: 13,
        }}
      >
        {display}
      </a>
    );
  }
  return <>{value}</>;
}

export default function StatementsPanel({
  claims,
  entityId,
  source,
  accentColor,
  bgColor,
  title,
  fetchLabels,
}: StatementsPanelProps) {
  const { t, i18n } = useTranslation();
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!claims) return;
    const lang = i18n.language;

    const ids = new Set<string>();
    for (const [propId, claimList] of Object.entries(claims)) {
      ids.add(propId);
      for (const claim of claimList) {
        if (claim.mainsnak.datavalue?.type === 'wikibase-entityid') {
          const v = claim.mainsnak.datavalue.value as { id?: string; 'numeric-id'?: number };
          ids.add(v.id || `Q${v['numeric-id']}`);
        }
        if (claim.mainsnak.datavalue?.type === 'quantity') {
          const v = claim.mainsnak.datavalue.value as { unit?: string };
          if (v.unit && v.unit !== '1') {
            const unitId = v.unit.split('/').pop();
            if (unitId) ids.add(unitId);
          }
        }
      }
    }

    let cancelled = false;
    setLoading(true);
    fetchLabels(Array.from(ids), lang).then((result) => {
      if (!cancelled) {
        setLabels(result);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [claims, i18n.language, fetchLabels]);

  if (!claims) return null;

  const baseUrl = source === 'wikidata'
    ? 'https://www.wikidata.org/wiki'
    : 'https://database.factgrid.de/wiki';

  const propertyIds = Object.keys(claims).filter((propId) => {
    const claimList = claims[propId];
    if (!claimList || claimList.length === 0) return false;
    const dt = claimList[0].mainsnak.datatype;
    if (dt && SKIP_DATATYPES.has(dt)) return false;
    return true;
  });

  if (propertyIds.length === 0) return null;

  const viewLabel = source === 'wikidata' ? t('view_on_wikidata') : t('view_on_factgrid');
  const entityUrl = source === 'wikidata'
    ? `${baseUrl}/${entityId}`
    : `${baseUrl}/Item:${entityId}`;

  // Pre-compute rendered properties
  const rendered = propertyIds
    .map((propId) => {
      const claimList = claims[propId];
      const propLabel = labels[propId] || propId;
      const values = claimList
        .filter((c) => c.mainsnak.snaktype === 'value' && (!c.rank || c.rank !== 'deprecated'))
        .map((c) => formatValue(c.mainsnak.datavalue, labels))
        .filter((v): v is string => v !== null);
      if (values.length === 0) return null;
      return { propId, propLabel, values };
    })
    .filter(Boolean) as Array<{ propId: string; propLabel: string; values: string[] }>;

  return (
    <details
      style={{
        marginTop: 16,
        borderRadius: 8,
        border: `1px solid ${accentColor}22`,
        overflow: 'hidden',
      }}
    >
      <summary
        style={{
          padding: '12px 14px',
          background: bgColor,
          cursor: 'pointer',
          fontWeight: 700,
          fontSize: 15,
          color: accentColor,
          listStyle: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span style={{ fontSize: 11, transition: 'transform 0.2s' }}>&#9654;</span>
        {title}
        <span style={{
          fontSize: 11,
          fontWeight: 500,
          color: '#999',
          marginLeft: 'auto',
          background: '#fff',
          borderRadius: 10,
          padding: '2px 8px',
        }}>
          {rendered.length}
        </span>
      </summary>

      <div style={{ padding: '4px 0 10px', background: bgColor }}>
        {loading ? (
          <div style={{ color: '#999', fontSize: 14, padding: '8px 14px' }}>{t('loading')}</div>
        ) : (
          <div>
            {rendered.map(({ propId, propLabel, values }) => (
              <div
                key={propId}
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid rgba(0,0,0,0.05)',
                }}
              >
                {/* Property label */}
                <a
                  href={`${baseUrl}/Property:${propId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'block',
                    fontSize: 11,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    color: accentColor,
                    opacity: 0.7,
                    marginBottom: 2,
                    textDecoration: 'none',
                  }}
                >
                  {propLabel}
                </a>

                {/* Values */}
                {values.length === 1 ? (
                  <div style={{
                    fontSize: 14,
                    lineHeight: 1.45,
                    color: 'var(--color-graphitschwarz)',
                    wordBreak: 'break-word',
                  }}>
                    <ValueDisplay value={values[0]} />
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    {values.map((v, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 14,
                          lineHeight: 1.45,
                          color: 'var(--color-graphitschwarz)',
                          wordBreak: 'break-word',
                          paddingLeft: 10,
                          borderLeft: `2px solid ${accentColor}33`,
                        }}
                      >
                        <ValueDisplay value={v} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div style={{ padding: '10px 14px 0' }}>
          <a
            href={entityUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: 13,
              color: accentColor,
              fontWeight: 600,
            }}
          >
            {viewLabel} →
          </a>
        </div>
      </div>
    </details>
  );
}
