import { useState, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { POIBase } from '../types';
import { useAdmin } from './useAdmin';
import { useAllPois } from './useAllPois';

interface AddPOIFormProps {
  onDone: () => void;
}

interface SearchResult {
  id: string;
  label: string;
  description: string;
  url: string;
}

interface FactGridCoords {
  latitude: number;
  longitude: number;
}

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for non-secure contexts
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function searchFactGrid(query: string, language: string): Promise<SearchResult[]> {
  if (!query.trim()) return [];
  const url =
    `https://database.factgrid.de/w/api.php?action=wbsearchentities` +
    `&search=${encodeURIComponent(query)}&language=${language}` +
    `&limit=10&format=json&origin=*`;
  const res = await fetch(url);
  if (!res.ok) return [];
  const data = await res.json();
  return (data.search ?? []).map((item: { id: string; label: string; description?: string; url: string }) => ({
    id: item.id,
    label: item.label,
    description: item.description ?? '',
    url: item.url,
  }));
}

async function fetchFactGridDetails(entityId: string): Promise<{
  labels: Record<string, string>;
  descriptions: Record<string, string>;
  coords: FactGridCoords | null;
  wikidataId: string | null;
  wikipediaDe: string | null;
  wikipediaEn: string | null;
  commonsCategory: string | null;
}> {
  const url = `https://database.factgrid.de/w/api.php?action=wbgetentities&ids=${entityId}&format=json&origin=*`;
  const res = await fetch(url);
  const data = await res.json();
  const entity = data.entities?.[entityId];
  if (!entity) return { labels: {}, descriptions: {}, coords: null, wikidataId: null, wikipediaDe: null, wikipediaEn: null, commonsCategory: null };

  const labels: Record<string, string> = {};
  for (const [lang, val] of Object.entries(entity.labels ?? {})) {
    labels[lang] = (val as { value: string }).value;
  }

  const descriptions: Record<string, string> = {};
  for (const [lang, val] of Object.entries(entity.descriptions ?? {})) {
    descriptions[lang] = (val as { value: string }).value;
  }

  // Extract coordinates from claims (search for globecoordinate type)
  let coords: FactGridCoords | null = null;
  const claims = entity.claims ?? {};

  for (const claimList of Object.values(claims) as Array<Array<{ mainsnak: { datavalue?: { type: string; value: unknown } } }>>) {
    for (const claim of claimList) {
      const dv = claim.mainsnak.datavalue;
      if (!dv) continue;
      if (dv.type === 'globecoordinate' && !coords) {
        const v = dv.value as { latitude: number; longitude: number };
        coords = { latitude: v.latitude, longitude: v.longitude };
      }
    }
  }

  // Extract Wikidata ID and Commons category from sitelinks
  let wikidataId: string | null = null;
  let commonsCategory: string | null = null;
  const sitelinks = entity.sitelinks ?? {};
  if (sitelinks.wikidatawiki) {
    wikidataId = (sitelinks.wikidatawiki as { title: string }).title;
  }
  if (sitelinks.commonswiki) {
    const commonsTitle = (sitelinks.commonswiki as { title: string }).title;
    commonsCategory = commonsTitle.replace(/^Category:/, '');
  }

  // Extract Wikipedia sitelinks
  let wikipediaDe: string | null = null;
  let wikipediaEn: string | null = null;
  if (sitelinks.dewiki) wikipediaDe = (sitelinks.dewiki as { title: string }).title.replace(/ /g, '_');
  if (sitelinks.enwiki) wikipediaEn = (sitelinks.enwiki as { title: string }).title.replace(/ /g, '_');

  return { labels, descriptions, coords, wikidataId, wikipediaDe, wikipediaEn, commonsCategory };
}

export default function AddPOIForm({ onDone }: AddPOIFormProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language as 'de' | 'en';
  const { addPOI } = useAdmin();
  const allPois = useAllPois();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<SearchResult | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Editable POI fields
  const [titleDe, setTitleDe] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [factgridId, setFactgridId] = useState('');
  const [wikidataId, setWikidataId] = useState('');
  const [wikipediaDe, setWikipediaDe] = useState('');
  const [wikipediaEn, setWikipediaEn] = useState('');
  const [commonsCategory, setCommonsCategory] = useState('');

  const searchTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleSearch = useCallback((value: string) => {
    setQuery(value);
    setSelected(null);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (!value.trim()) {
      setResults([]);
      return;
    }
    searchTimeout.current = setTimeout(async () => {
      setSearching(true);
      const res = await searchFactGrid(value, lang);
      setResults(res);
      setSearching(false);
    }, 300);
  }, [lang]);

  const handleSelect = useCallback(async (result: SearchResult) => {
    setSelected(result);
    setResults([]);
    setQuery(result.label);
    setLoadingDetails(true);

    const details = await fetchFactGridDetails(result.id);

    setTitleDe(details.labels.de ?? result.label);
    setTitleEn(details.labels.en ?? '');
    setFactgridId(result.id);
    setWikidataId(details.wikidataId ?? '');
    setWikipediaDe(details.wikipediaDe ?? '');
    setWikipediaEn(details.wikipediaEn ?? '');
    setCommonsCategory(details.commonsCategory ?? '');
    if (details.coords) {
      setLat(String(details.coords.latitude));
      setLng(String(details.coords.longitude));
    } else {
      setLat('');
      setLng('');
    }
    setLoadingDetails(false);
  }, []);

  const handleSave = useCallback(() => {
    const parsedLat = parseFloat(lat);
    const parsedLng = parseFloat(lng);
    if (!titleDe || isNaN(parsedLat) || isNaN(parsedLng)) return;

    const maxId = allPois.reduce((max, p) => Math.max(max, p.id), 0);
    const poi: POIBase = {
      id: maxId + 1,
      slug: slugify(titleDe),
      title_de: titleDe,
      title_en: titleEn || titleDe,
      lat: parsedLat,
      lng: parsedLng,
      uuid: generateUUID(),
      factgrid_id: factgridId || null,
      wikipedia_de: wikipediaDe || null,
      wikipedia_en: wikipediaEn || null,
      wikidata_id: wikidataId || null,
      commons_category: commonsCategory || null,
    };
    addPOI(poi);
    onDone();
  }, [titleDe, titleEn, lat, lng, factgridId, wikidataId, wikipediaDe, wikipediaEn, commonsCategory, allPois, addPOI, onDone]);

  const canSave = titleDe && lat && lng && !isNaN(parseFloat(lat)) && !isNaN(parseFloat(lng));

  const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    fontSize: 14,
    border: '1px solid #ddd',
    borderRadius: 6,
    outline: 'none',
    fontFamily: 'var(--font-family)',
    boxSizing: 'border-box' as const,
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 700 as const,
    color: '#999',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.04em',
    marginBottom: 4,
    display: 'block' as const,
  };

  return (
    <div style={{ background: '#f5f5f5', minHeight: '100%' }}>
      <div style={{
        padding: '12px 12px 8px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <button
          onClick={onDone}
          style={{
            background: 'transparent',
            border: 'none',
            fontSize: 20,
            cursor: 'pointer',
            padding: '4px 8px',
            color: 'var(--color-trollingerblau)',
          }}
        >
          ←
        </button>
        <h2 style={{
          margin: 0,
          fontSize: 16,
          fontWeight: 700,
          color: 'var(--color-trollingerblau)',
        }}>
          {t('admin_add_poi')}
        </h2>
      </div>

      <div style={{ padding: '0 12px 16px' }}>
        {/* FactGrid search */}
        <div style={{
          background: '#fff',
          borderRadius: 8,
          padding: 14,
          marginBottom: 12,
        }}>
          <span style={labelStyle}>{t('admin_search_factgrid')}</span>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('admin_search_placeholder')}
              autoFocus
              style={inputStyle}
            />
            {searching && (
              <div style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                fontSize: 12,
                color: '#999',
              }}>
                {t('loading')}
              </div>
            )}
          </div>

          {/* Search results dropdown */}
          {results.length > 0 && (
            <div style={{
              border: '1px solid #ddd',
              borderRadius: 6,
              marginTop: 4,
              maxHeight: 250,
              overflow: 'auto',
              background: '#fff',
            }}>
              {results.map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleSelect(r)}
                  style={{
                    display: 'block',
                    width: '100%',
                    padding: '10px 12px',
                    border: 'none',
                    borderBottom: '1px solid #f0f0f0',
                    background: 'transparent',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontFamily: 'var(--font-family)',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--color-graphitschwarz)' }}>
                    {r.label}
                    <span style={{ color: 'var(--color-loungeviolett)', fontSize: 11, marginLeft: 6 }}>
                      {r.id}
                    </span>
                  </div>
                  {r.description && (
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                      {r.description}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div style={{
              marginTop: 8,
              padding: '8px 10px',
              background: '#f0f4ff',
              borderRadius: 6,
              fontSize: 13,
              color: 'var(--color-trollingerblau)',
              fontWeight: 600,
            }}>
              FactGrid: {selected.id} — {selected.label}
            </div>
          )}
        </div>

        {loadingDetails && (
          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: 14,
            textAlign: 'center',
            color: '#999',
            fontSize: 14,
          }}>
            {t('loading')}
          </div>
        )}

        {/* Editable fields (shown after selection or for manual entry) */}
        {(selected || !query) && !loadingDetails && (
          <div style={{
            background: '#fff',
            borderRadius: 8,
            padding: 14,
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}>
            <div>
              <span style={labelStyle}>{t('admin_title_de')} *</span>
              <input type="text" value={titleDe} onChange={(e) => setTitleDe(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>{t('admin_title_en')}</span>
              <input type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>{t('admin_latitude')} *</span>
                <input type="text" value={lat} onChange={(e) => setLat(e.target.value)} placeholder="50.9474" style={inputStyle} />
              </div>
              <div style={{ flex: 1 }}>
                <span style={labelStyle}>{t('admin_longitude')} *</span>
                <input type="text" value={lng} onChange={(e) => setLng(e.target.value)} placeholder="10.7048" style={inputStyle} />
              </div>
            </div>
            <div>
              <span style={labelStyle}>FactGrid ID</span>
              <input type="text" value={factgridId} onChange={(e) => setFactgridId(e.target.value)} placeholder="Q12345" style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>Wikidata ID</span>
              <input type="text" value={wikidataId} onChange={(e) => setWikidataId(e.target.value)} placeholder="Q12345" style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>Wikipedia DE</span>
              <input type="text" value={wikipediaDe} onChange={(e) => setWikipediaDe(e.target.value)} placeholder="Artikelname" style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>Wikipedia EN</span>
              <input type="text" value={wikipediaEn} onChange={(e) => setWikipediaEn(e.target.value)} placeholder="Article_name" style={inputStyle} />
            </div>
            <div>
              <span style={labelStyle}>Commons Category</span>
              <input type="text" value={commonsCategory} onChange={(e) => setCommonsCategory(e.target.value)} placeholder="Category name" style={inputStyle} />
            </div>

            <button
              onClick={handleSave}
              disabled={!canSave}
              style={{
                width: '100%',
                padding: '14px',
                background: canSave ? 'var(--color-seidengruen)' : '#ccc',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontSize: 15,
                fontWeight: 700,
                cursor: canSave ? 'pointer' : 'not-allowed',
                fontFamily: 'var(--font-family)',
                marginTop: 4,
              }}
            >
              {t('admin_save')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
