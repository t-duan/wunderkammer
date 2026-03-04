import { useTranslation } from 'react-i18next';
import { usePageviews } from '../hooks/usePageviews';

interface PageviewChartProps {
  articleDe: string | null;
  articleEn: string | null;
}

export default function PageviewChart({ articleDe, articleEn }: PageviewChartProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'de' | 'en';
  const article = lang === 'en' && articleEn ? articleEn : articleDe;
  const effectiveLang = lang === 'en' && articleEn ? 'en' : 'de';
  const { stats, loading, error } = usePageviews(article, effectiveLang);

  if (!article) return null;
  if (loading) {
    return (
      <div style={{ marginTop: 16, color: '#999', fontSize: 14 }}>
        {t('loading')}
      </div>
    );
  }
  if (error) {
    console.warn('PageviewChart error:', error);
  }
  if (!stats || stats.daily.length === 0) return null;

  const { daily, total, avg } = stats;
  const maxViews = Math.max(...daily.map((d) => d.views));
  const minViews = Math.min(...daily.map((d) => d.views));

  // SVG sparkline
  const width = 320;
  const height = 80;
  const padding = 2;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;

  const range = maxViews - minViews || 1;
  const points = daily.map((d, i) => {
    const x = padding + (i / (daily.length - 1)) * chartW;
    const y = padding + chartH - ((d.views - minViews) / range) * chartH;
    return `${x},${y}`;
  });
  const polyline = points.join(' ');

  // Area fill
  const areaPath =
    `M ${padding},${padding + chartH} ` +
    daily
      .map((d, i) => {
        const x = padding + (i / (daily.length - 1)) * chartW;
        const y = padding + chartH - ((d.views - minViews) / range) * chartH;
        return `L ${x},${y}`;
      })
      .join(' ') +
    ` L ${padding + chartW},${padding + chartH} Z`;

  const firstDate = daily[0].date;
  const lastDate = daily[daily.length - 1].date;

  const wikiUrl = `https://${effectiveLang}.wikipedia.org/wiki/${encodeURIComponent(article)}`;

  return (
    <div
      style={{
        marginTop: 16,
        padding: 12,
        background: '#f9fafb',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
      }}
    >
      <h3
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--color-trollingerblau)',
          margin: '0 0 8px',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        <span style={{ fontSize: 16 }}>W</span>
        {t('pageviews_title')}
      </h3>

      {/* Stats row */}
      <div
        style={{
          display: 'flex',
          gap: 16,
          marginBottom: 8,
          fontSize: 13,
          color: '#555',
        }}
      >
        <div>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-trollingerblau)' }}>
            {total.toLocaleString(lang)}
          </span>
          <div>{t('pageviews_total')}</div>
        </div>
        <div>
          <span style={{ fontWeight: 700, fontSize: 18, color: 'var(--color-seidengruen)' }}>
            {avg.toLocaleString(lang)}
          </span>
          <div>{t('pageviews_avg')}</div>
        </div>
      </div>

      {/* SVG chart */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <path d={areaPath} fill="var(--color-seidengruen)" opacity={0.15} />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--color-seidengruen)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>

      {/* Date range */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: '#999',
          marginTop: 2,
        }}
      >
        <span>{firstDate}</span>
        <span>{lastDate}</span>
      </div>

      {/* Link */}
      <a
        href={wikiUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'inline-block',
          marginTop: 8,
          fontSize: 12,
          color: 'var(--color-seidengruen)',
          fontWeight: 600,
        }}
      >
        {effectiveLang}.wikipedia.org →
      </a>
    </div>
  );
}
