import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from './useAuth';

interface ChangePasswordFormProps {
  onDone: () => void;
}

export default function ChangePasswordForm({ onDone }: ChangePasswordFormProps) {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError(t('admin_passwords_no_match'));
      return;
    }
    if (newPassword.length < 4) {
      setError(t('admin_password_too_short'));
      return;
    }

    setSubmitting(true);
    const err = await changePassword(currentPassword, newPassword);
    setSubmitting(false);

    if (err) {
      setError(t('admin_current_password_wrong'));
    } else {
      setSuccess(true);
      setTimeout(onDone, 1500);
    }
  };

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 6,
    outline: 'none',
    fontFamily: 'var(--font-family)',
    boxSizing: 'border-box' as const,
    marginBottom: 8,
  };

  if (success) {
    return (
      <div style={{
        marginTop: 12,
        padding: 12,
        background: '#e8f5e9',
        borderRadius: 6,
        color: '#2e7d32',
        fontSize: 14,
        fontWeight: 600,
        textAlign: 'center',
      }}>
        {t('admin_password_changed')}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 12 }}>
      <input
        type="password"
        value={currentPassword}
        onChange={(e) => setCurrentPassword(e.target.value)}
        placeholder={t('admin_current_password')}
        autoComplete="current-password"
        style={inputStyle}
      />
      <input
        type="password"
        value={newPassword}
        onChange={(e) => setNewPassword(e.target.value)}
        placeholder={t('admin_new_password')}
        autoComplete="new-password"
        style={inputStyle}
      />
      <input
        type="password"
        value={confirmPassword}
        onChange={(e) => setConfirmPassword(e.target.value)}
        placeholder={t('admin_confirm_password')}
        autoComplete="new-password"
        style={inputStyle}
      />

      {error && (
        <div style={{ color: 'var(--color-gerberarot)', fontSize: 13, marginBottom: 8 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || !currentPassword || !newPassword || !confirmPassword}
        style={{
          width: '100%',
          padding: '10px',
          background: submitting ? '#999' : 'var(--color-seidengruen)',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontSize: 14,
          fontWeight: 700,
          cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: 'var(--font-family)',
        }}
      >
        {submitting ? t('loading') : t('admin_save')}
      </button>
    </form>
  );
}
