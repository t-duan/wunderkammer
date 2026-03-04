import type { CommonsImage } from '../types';
import { cacheGet, cacheSet } from './cache';

export function commonsThumbUrl(filename: string, width = 400): string {
  const encoded = encodeURIComponent(filename.replace(/ /g, '_'));
  return `https://commons.wikimedia.org/w/thumb.php?f=${encoded}&w=${width}`;
}

export function commonsFileUrl(filename: string): string {
  const name = filename.replace(/ /g, '_');
  const encoded = encodeURIComponent(name);
  return `https://commons.wikimedia.org/wiki/File:${encoded}`;
}

export async function fetchCommonsImages(
  category: string,
  limit = 50
): Promise<CommonsImage[]> {
  const cacheKey = `commons_all_${category}`;
  const cached = cacheGet<CommonsImage[]>(cacheKey);
  if (cached) return cached;

  try {
    let allImages: CommonsImage[] = [];
    let gcmcontinue: string | undefined;

    do {
      const url =
        `https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers` +
        `&gcmtitle=Category:${encodeURIComponent(category)}` +
        `&gcmtype=file&gcmlimit=${Math.min(limit - allImages.length, 50)}` +
        `&prop=imageinfo&iiprop=url|size|mime` +
        `&iiurlwidth=400&format=json&origin=*` +
        (gcmcontinue ? `&gcmcontinue=${gcmcontinue}` : '');

      const res = await fetch(url);
      if (!res.ok) break;
      const data = await res.json();
      const pages = data.query?.pages;
      if (!pages) break;

      const batch: CommonsImage[] = Object.values(pages)
        .filter((p: unknown) => {
          const page = p as { imageinfo?: Array<{ mime: string }> };
          return page.imageinfo?.[0]?.mime?.startsWith('image/');
        })
        .map((p: unknown) => {
          const page = p as {
            title: string;
            imageinfo: Array<{
              url: string;
              thumburl: string;
              width: number;
              height: number;
            }>;
          };
          const info = page.imageinfo[0];
          return {
            title: page.title.replace('File:', ''),
            url: info.url,
            thumbUrl: info.thumburl,
            width: info.width,
            height: info.height,
          };
        });

      allImages = allImages.concat(batch);
      gcmcontinue = data.continue?.gcmcontinue;
    } while (gcmcontinue && allImages.length < limit);

    cacheSet(cacheKey, allImages);
    return allImages;
  } catch {
    return [];
  }
}

export async function fetchCommonsImageByName(
  filename: string
): Promise<CommonsImage | null> {
  const cacheKey = `commons_file_${filename}`;
  const cached = cacheGet<CommonsImage>(cacheKey);
  if (cached) return cached;

  try {
    const url =
      `https://commons.wikimedia.org/w/api.php?action=query&titles=File:${encodeURIComponent(filename)}` +
      `&prop=imageinfo&iiprop=url|size&iiurlwidth=800&format=json&origin=*`;

    const res = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return null;

    const page = Object.values(pages)[0] as {
      title: string;
      imageinfo?: Array<{
        url: string;
        thumburl: string;
        width: number;
        height: number;
      }>;
    };
    if (!page.imageinfo?.[0]) return null;

    const info = page.imageinfo[0];
    const image: CommonsImage = {
      title: page.title.replace('File:', ''),
      url: info.url,
      thumbUrl: info.thumburl,
      width: info.width,
      height: info.height,
    };
    cacheSet(cacheKey, image);
    return image;
  } catch {
    return null;
  }
}
