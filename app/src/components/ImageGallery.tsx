import { useTranslation } from 'react-i18next';
import { useCommons } from '../hooks/useCommons';

interface ImageGalleryProps {
  category: string | null;
}

export default function ImageGallery({ category }: ImageGalleryProps) {
  const { t } = useTranslation();
  const { images, loading } = useCommons(category);

  if (!category || (images.length === 0 && !loading)) return null;

  return (
    <div style={{ marginTop: 16 }}>
      <h3
        style={{
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--color-trollingerblau)',
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        {t('images')}
        {!loading && images.length > 0 && (
          <span style={{ fontSize: 12, fontWeight: 400, color: '#999' }}>
            ({images.length})
          </span>
        )}
      </h3>
      {loading ? (
        <div style={{ color: '#999', fontSize: 14 }}>{t('loading')}</div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
            gap: 8,
          }}
        >
          {images.map((img) => (
            <a
              key={img.title}
              href={img.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: 'block' }}
            >
              <img
                src={img.thumbUrl}
                alt={img.title}
                style={{
                  width: '100%',
                  height: 120,
                  objectFit: 'cover',
                  borderRadius: 6,
                  display: 'block',
                }}
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
