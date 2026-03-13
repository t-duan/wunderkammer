import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { POIBase } from '../types';
import { pois as staticPois } from '../data/pois';
import { useAdmin } from './useAdmin';
import { useAuth } from './useAuth';
import { useAllPois } from './useAllPois';
import AdminPOIEditor from './AdminPOIEditor';
import ChangePasswordForm from './ChangePasswordForm';
import AddPOIForm from './AddPOIForm';

export default function AdminDashboard() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'de' | 'en';
  const { getConfig, updatePOI, removePOI } = useAdmin();
  const { username } = useAuth();
  const allPois = useAllPois();
  const [editingPOI, setEditingPOI] = useState<POIBase | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showAddPOI, setShowAddPOI] = useState(false);

  const staticIds = new Set(staticPois.map((p) => p.id));

  if (editingPOI) {
    return (
      <AdminPOIEditor
        poi={editingPOI}
        onBack={() => setEditingPOI(null)}
      />
    );
  }

  if (showAddPOI) {
    return <AddPOIForm onDone={() => setShowAddPOI(false)} />;
  }

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100%' }}>
      <div style={{ padding: '16px 12px 8px' }}>
        <h2 style={{
          margin: 0,
          fontSize: 18,
          fontWeight: 700,
          color: 'var(--color-trollingerblau)',
        }}>
          {t('admin_title')}
        </h2>
        <p style={{ fontSize: 13, color: '#666', margin: '4px 0 0' }}>
          {t('admin_subtitle')}
        </p>
      </div>

      <div style={{ padding: '0 12px 16px' }}>
        {/* Account section */}
        <div style={{
          background: '#fff',
          borderRadius: 8,
          padding: '12px 14px',
          marginBottom: 12,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: '#999', letterSpacing: '0.04em' }}>
                {t('admin_logged_in_as')}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--color-graphitschwarz)', marginTop: 2 }}>
                {username}
              </div>
            </div>
            <button
              onClick={() => setShowPassword(!showPassword)}
              style={{
                background: showPassword ? 'var(--color-gerberarot)' : 'var(--color-trollingerblau)',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showPassword ? t('admin_cancel') : t('admin_change_password')}
            </button>
          </div>
          {showPassword && (
            <ChangePasswordForm onDone={() => setShowPassword(false)} />
          )}
        </div>

        {/* Add POI button */}
        <button
          onClick={() => setShowAddPOI(true)}
          style={{
            width: '100%',
            padding: '12px',
            background: 'var(--color-seidengruen)',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            marginBottom: 12,
            fontFamily: 'var(--font-family)',
          }}
        >
          + {t('admin_add_poi')}
        </button>

        {/* POI list */}
        {allPois.map((poi) => {
          const cfg = getConfig(poi.id);
          const title = lang === 'en' ? poi.title_en : poi.title_de;
          const isCustom = !staticIds.has(poi.id);

          return (
            <div
              key={poi.id}
              style={{
                background: '#fff',
                borderRadius: 8,
                padding: '12px 14px',
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: cfg.enabled ? 1 : 0.5,
              }}
            >
              <button
                onClick={() => updatePOI(poi.id, { enabled: !cfg.enabled })}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 12,
                  border: 'none',
                  background: cfg.enabled ? 'var(--color-seidengruen)' : '#ccc',
                  cursor: 'pointer',
                  position: 'relative',
                  flexShrink: 0,
                  transition: 'background 0.2s',
                }}
                aria-label={cfg.enabled ? t('admin_disable') : t('admin_enable')}
              >
                <span style={{
                  position: 'absolute',
                  top: 2,
                  left: cfg.enabled ? 22 : 2,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: '#fff',
                  transition: 'left 0.2s',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: 'var(--color-graphitschwarz)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  <span style={{ color: 'var(--color-gerberarot)', marginRight: 6 }}>
                    #{poi.id}
                  </span>
                  {title}
                  {isCustom && (
                    <span style={{
                      fontSize: 10,
                      background: 'var(--color-loungeviolett)',
                      color: '#fff',
                      padding: '1px 6px',
                      borderRadius: 4,
                      marginLeft: 6,
                      fontWeight: 600,
                      verticalAlign: 'middle',
                    }}>
                      {t('admin_custom')}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
                  {[
                    poi.factgrid_id ? `FG: ${poi.factgrid_id}` : null,
                    cfg.previewLength !== null ? `${t('admin_preview')}: ${cfg.previewLength}` : null,
                    cfg.wikidataProperties ? `WD: ${cfg.wikidataProperties.length}` : null,
                    cfg.factgridProperties ? `FG: ${cfg.factgridProperties.length}` : null,
                    cfg.selectedImages ? `${t('images')}: ${cfg.selectedImages.length}` : null,
                  ].filter(Boolean).join(' · ') || t('admin_default_settings')}
                </div>
              </div>

              <button
                onClick={() => setEditingPOI(poi)}
                style={{
                  background: 'var(--color-trollingerblau)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '6px 14px',
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {t('admin_edit')}
              </button>

              {isCustom && (
                <button
                  onClick={() => {
                    if (confirm(t('admin_confirm_remove'))) {
                      removePOI(poi.id);
                    }
                  }}
                  style={{
                    background: 'var(--color-gerberarot)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '6px 10px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
