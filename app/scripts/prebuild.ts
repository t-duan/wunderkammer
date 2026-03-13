/**
 * Pre-build script: fetches Wikipedia summaries, Wikidata, FactGrid, and Commons data
 * for all POIs and writes pois-prebuilt.json to public/data/.
 */

interface POIBase {
  id: number;
  slug: string;
  title_de: string;
  title_en: string;
  lat: number;
  lng: number;
  factgrid_id: string | null;
  wikipedia_de: string | null;
  wikipedia_en: string | null;
  wikidata_id: string | null;
  commons_category: string | null;
}

interface PrebuiltPOI {
  id: number;
  summary_de: string;
  summary_en: string;
  thumbnail: string | null;
  marker_image: string | null;
  wikidata_label: string | null;
  wikidata_description_de: string | null;
  wikidata_description_en: string | null;
  factgrid_label: string | null;
  factgrid_description: string | null;
  images: string[];
  fetched_at: string;
}

// Import POI data - we inline it here to avoid tsx/esm import complexities
import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Read POIs from source
const poisModule = join(__dirname, '..', 'src', 'data', 'pois.ts');
const poisContent = readFileSync(poisModule, 'utf-8');

// Parse POIs from the TS file (extract the array)
const arrayMatch = poisContent.match(/export const pois: POIBase\[\] = (\[[\s\S]*\]);/);
if (!arrayMatch) {
  console.error('Could not parse pois.ts');
  process.exit(1);
}

// Use Function constructor to evaluate the array literal
const pois: POIBase[] = new Function(`return ${arrayMatch[1]}`)();

async function fetchJSON(url: string): Promise<unknown> {
  const res = await fetch(url);
  if (!res.ok) return null;
  return res.json();
}

async function getWikipediaSummary(title: string, lang: string): Promise<{ extract: string; thumbnail: string | null } | null> {
  try {
    const data = await fetchJSON(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    ) as { extract?: string; thumbnail?: { source: string } } | null;
    if (!data) return null;
    return {
      extract: data.extract || '',
      thumbnail: data.thumbnail?.source || null,
    };
  } catch {
    return null;
  }
}

async function getWikidataEntity(entityId: string): Promise<{
  label: string | null;
  description_de: string | null;
  description_en: string | null;
}> {
  try {
    const data = await fetchJSON(
      `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&format=json&origin=*`
    ) as { entities?: Record<string, { labels?: Record<string, { value: string }>; descriptions?: Record<string, { value: string }> }> } | null;
    const entity = data?.entities?.[entityId];
    if (!entity) return { label: null, description_de: null, description_en: null };
    return {
      label: entity.labels?.de?.value || entity.labels?.en?.value || null,
      description_de: entity.descriptions?.de?.value || null,
      description_en: entity.descriptions?.en?.value || null,
    };
  } catch {
    return { label: null, description_de: null, description_en: null };
  }
}

async function getFactGridEntity(entityId: string): Promise<{
  label: string | null;
  description: string | null;
}> {
  try {
    const data = await fetchJSON(
      `https://database.factgrid.de/w/api.php?action=wbgetentities&ids=${entityId}&format=json&origin=*`
    ) as { entities?: Record<string, { labels?: Record<string, { value: string }>; descriptions?: Record<string, { value: string }> }> } | null;
    const entity = data?.entities?.[entityId];
    if (!entity) return { label: null, description: null };
    return {
      label: entity.labels?.en?.value || entity.labels?.de?.value || null,
      description: entity.descriptions?.en?.value || entity.descriptions?.de?.value || null,
    };
  } catch {
    return { label: null, description: null };
  }
}

async function getCommonsMarkerThumb(category: string): Promise<string | null> {
  try {
    const data = await fetchJSON(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers` +
      `&gcmtitle=Category:${encodeURIComponent(category)}&gcmtype=file&gcmlimit=1` +
      `&prop=imageinfo&iiprop=url&iiurlwidth=80&format=json&origin=*`
    ) as { query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl: string }> }> } } | null;
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0];
    return page?.imageinfo?.[0]?.thumburl || null;
  } catch {
    return null;
  }
}

async function getCommonsImages(category: string, limit = 4): Promise<string[]> {
  try {
    const data = await fetchJSON(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers` +
      `&gcmtitle=Category:${encodeURIComponent(category)}&gcmtype=file&gcmlimit=${limit}` +
      `&prop=imageinfo&iiprop=url&iiurlwidth=400&format=json&origin=*`
    ) as { query?: { pages?: Record<string, { imageinfo?: Array<{ thumburl: string }> }> } } | null;
    const pages = data?.query?.pages;
    if (!pages) return [];
    return Object.values(pages)
      .map((p) => p.imageinfo?.[0]?.thumburl)
      .filter((url): url is string => !!url);
  } catch {
    return [];
  }
}

async function main() {
  console.log(`Prebuilding data for ${pois.length} POIs...`);
  const results: PrebuiltPOI[] = [];

  for (const poi of pois) {
    console.log(`  ${poi.id}: ${poi.title_de}`);

    const [wikiDe, wikiEn, wikidata, factgrid, images, markerThumb] = await Promise.all([
      poi.wikipedia_de ? getWikipediaSummary(poi.wikipedia_de, 'de') : null,
      poi.wikipedia_en ? getWikipediaSummary(poi.wikipedia_en, 'en') : null,
      poi.wikidata_id ? getWikidataEntity(poi.wikidata_id) : null,
      poi.factgrid_id ? getFactGridEntity(poi.factgrid_id) : null,
      poi.commons_category ? getCommonsImages(poi.commons_category) : Promise.resolve([]),
      poi.commons_category ? getCommonsMarkerThumb(poi.commons_category) : Promise.resolve(null),
    ]);

    const thumbnail = wikiDe?.thumbnail || wikiEn?.thumbnail || null;
    results.push({
      id: poi.id,
      summary_de: wikiDe?.extract || '',
      summary_en: wikiEn?.extract || '',
      thumbnail,
      marker_image: markerThumb || thumbnail || null,
      wikidata_label: wikidata?.label || null,
      wikidata_description_de: wikidata?.description_de || null,
      wikidata_description_en: wikidata?.description_en || null,
      factgrid_label: factgrid?.label || null,
      factgrid_description: factgrid?.description || null,
      images: images || [],
      fetched_at: new Date().toISOString(),
    });
  }

  const outDir = join(__dirname, '..', 'public', 'data');
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, 'pois-prebuilt.json');
  writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Written ${results.length} POIs to ${outPath}`);
}

main().catch((err) => {
  console.error('Prebuild failed:', err);
  process.exit(1);
});
