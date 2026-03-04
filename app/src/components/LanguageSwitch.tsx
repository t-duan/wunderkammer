import { useTranslation } from 'react-i18next';

export default function LanguageSwitch() {
  const { i18n, t } = useTranslation();

  const toggle = () => {
    i18n.changeLanguage(i18n.language === 'de' ? 'en' : 'de');
  };

  return (
    <button
      onClick={toggle}
      style={{
        background: 'transparent',
        border: '1px solid rgba(255,255,255,0.5)',
        color: '#fff',
        padding: '4px 12px',
        borderRadius: 4,
        fontFamily: 'var(--font-family)',
        fontWeight: 600,
        fontSize: 14,
        cursor: 'pointer',
      }}
    >
      {t('language')}
    </button>
  );
}
