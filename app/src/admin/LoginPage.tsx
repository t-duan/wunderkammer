import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';

export default function LoginPage() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const err = await login(username, password);
    if (err) {
      setError(err);
      setSubmitting(false);
    }
  };

  const inputStyle = (hasError: boolean) => ({
    width: '100%',
    padding: '12px 14px',
    fontSize: 15,
    border: `2px solid ${hasError ? 'var(--color-gerberarot)' : '#ddd'}`,
    borderRadius: 8,
    outline: 'none',
    fontFamily: 'var(--font-family)',
    boxSizing: 'border-box' as const,
  });

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100%',
      background: '#f5f5f5',
      padding: 16,
    }}>
      <form
        onSubmit={handleSubmit}
        style={{
          background: '#fff',
          borderRadius: 12,
          padding: 32,
          width: '100%',
          maxWidth: 360,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{
          margin: '0 0 8px',
          fontSize: 20,
          fontWeight: 700,
          color: 'var(--color-trollingerblau)',
          textAlign: 'center',
        }}>
          {t('admin_title')}
        </h2>
        <p style={{
          fontSize: 13,
          color: '#666',
          textAlign: 'center',
          margin: '0 0 24px',
        }}>
          {t('admin_login_prompt')}
        </p>

        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder={t('admin_username')}
          autoFocus
          autoComplete="username"
          style={{ ...inputStyle(!!error), marginBottom: 10 }}
        />

        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('admin_password')}
          autoComplete="current-password"
          style={inputStyle(!!error)}
        />

        {error && (
          <div style={{
            color: 'var(--color-gerberarot)',
            fontSize: 13,
            marginTop: 8,
            textAlign: 'center',
          }}>
            {t('admin_login_error')}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !username || !password}
          style={{
            width: '100%',
            padding: '12px',
            marginTop: 16,
            background: submitting ? '#999' : 'var(--color-trollingerblau)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 700,
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontFamily: 'var(--font-family)',
          }}
        >
          {submitting ? t('loading') : t('admin_login')}
        </button>
      </form>
    </div>
  );
}
