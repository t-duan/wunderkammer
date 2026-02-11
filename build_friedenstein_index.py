"""
Build a comprehensive index of all Friedenstein stops/artworks
with resolved asset URLs (images + audio).
"""
import json
import os
import urllib.request
import time

BASE = "https://v3.rest.delivery.tapart.me/api"
DATA_DIR = "/home/td/wunderkammer/friedenstein_data"
MEDIA_BASE = "https://media.tapart.me/media/friedenstein-stiftung"


def load_json(path):
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def fetch_json(url):
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        return None


def main():
    entities = load_json(os.path.join(DATA_DIR, "entities.json"))

    # Index by uuid
    by_uuid = {e["uuid"]: e for e in entities}

    # Separate by content type
    stops = [e for e in entities if e.get("contentTypeSlug") == "stop"]
    segments = {e["uuid"]: e for e in entities if e.get("contentTypeSlug") == "audio_segment"}
    assets_entities = {e["uuid"]: e for e in entities if e.get("contentTypeSlug") == "asset"}
    galleries = [e for e in entities if e.get("contentTypeSlug") == "photo_collection"]
    info_pages = [e for e in entities if e.get("contentTypeSlug") == "info_page"]
    comment_segments = [e for e in entities if e.get("contentTypeSlug") == "comment_segment"]

    print(f"Stops: {len(stops)}")
    print(f"Audio segments: {len(segments)}")
    print(f"Assets: {len(assets_entities)}")
    print(f"Galleries: {len(galleries)}")
    print(f"Info pages: {len(info_pages)}")
    print(f"Comment segments: {len(comment_segments)}")

    # Resolve asset UUIDs to URLs - fetch asset details for all referenced UUIDs
    all_asset_uuids = set()
    for e in entities:
        refs = e.get("metadata", {}).get("referenceUuids", {}).get("asset", [])
        all_asset_uuids.update(refs)
        content = e.get("content", {})
        # audio files
        af = content.get("audiofile", {})
        if isinstance(af, dict):
            all_asset_uuids.update(af.values())
        # images
        img = content.get("image")
        if isinstance(img, str) and len(img) == 36:
            all_asset_uuids.add(img)

    # Check which assets we already have details for
    asset_cache_path = os.path.join(DATA_DIR, "asset_details_cache.json")
    if os.path.exists(asset_cache_path):
        asset_cache = load_json(asset_cache_path)
    else:
        asset_cache = {}

    missing = all_asset_uuids - set(asset_cache.keys())
    print(f"\nNeed to fetch {len(missing)} asset details (cached: {len(asset_cache)})")

    for i, uuid in enumerate(sorted(missing)):
        if i % 50 == 0 and i > 0:
            print(f"  Fetched {i}/{len(missing)}...")
        url = f"{BASE}/friedenstein-stiftung/spaces/1/entities/{uuid}"
        data = fetch_json(url)
        if data and isinstance(data, list) and len(data) > 0:
            asset_cache[uuid] = data[0]
        elif data and isinstance(data, dict):
            asset_cache[uuid] = data
        time.sleep(0.05)

    # Save cache
    with open(asset_cache_path, "w", encoding="utf-8") as f:
        json.dump(asset_cache, f, ensure_ascii=False, indent=2)
    print(f"Asset cache saved ({len(asset_cache)} entries)")

    def resolve_asset(uuid):
        """Get media info for an asset UUID."""
        asset = asset_cache.get(uuid)
        if not asset:
            return None
        content = asset.get("content", {})
        source = content.get("source")
        if isinstance(source, str):
            return {
                "url": source,
                "filename": content.get("file_name"),
                "mime_type": content.get("mime_type", {}).get("template"),
                "file_size": content.get("file_size"),
                "width": content.get("width"),
                "height": content.get("height"),
            }
        return None

    # Build comprehensive stop index
    stop_index = []
    for stop in sorted(stops, key=lambda s: s.get("content", {}).get("stopnumber", 0)):
        content = stop.get("content", {})
        title = content.get("title", {})
        seg_uuid = content.get("primary_segment")
        image_uuid = content.get("image")

        image_info = resolve_asset(image_uuid) if image_uuid else None
        entry = {
            "uuid": stop["uuid"],
            "stopnumber": content.get("stopnumber"),
            "title_de": title.get("de-DE", ""),
            "title_en": title.get("en-US", ""),
            "image": image_info,
        }

        # Resolve audio segment
        if seg_uuid and seg_uuid in segments:
            seg = segments[seg_uuid]
            seg_content = seg.get("content", {})
            audiofiles = seg_content.get("audiofile", {})
            entry["audio_segment_uuid"] = seg_uuid
            entry["audio_de"] = resolve_asset(audiofiles.get("de-DE", ""))
            entry["audio_en"] = resolve_asset(audiofiles.get("en-US", ""))

        stop_index.append(entry)

    # Build gallery index
    gallery_index = []
    for g in galleries:
        content = g.get("content", {})
        title = content.get("title", {})
        gallery_index.append({
            "uuid": g["uuid"],
            "title_de": title.get("de-DE", ""),
            "title_en": title.get("en-US", ""),
            "image_uuid": content.get("image"),
            "image": resolve_asset(content.get("image", "")) if content.get("image") else None,
            "objects": content.get("objects", []),
        })

    # Build info page index
    info_index = []
    for p in info_pages:
        content = p.get("content", {})
        title = content.get("title", {})
        info_index.append({
            "uuid": p["uuid"],
            "title_de": title.get("de-DE", ""),
            "title_en": title.get("en-US", ""),
            "body_de": content.get("body", {}).get("de-DE", ""),
            "body_en": content.get("body", {}).get("en-US", ""),
        })

    # Save everything
    output = {
        "stops": stop_index,
        "galleries": gallery_index,
        "info_pages": info_index,
        "stats": {
            "total_entities": len(entities),
            "stops": len(stops),
            "audio_segments": len(segments),
            "assets": len(assets_entities),
            "galleries": len(galleries),
            "info_pages": len(info_pages),
        }
    }

    out_path = os.path.join(DATA_DIR, "friedenstein_index.json")
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\nIndex saved to {out_path}")

    # Print readable summary
    print(f"\n{'='*80}")
    print(f"FRIEDENSTEIN MUSEUM - COMPLETE STOP INDEX")
    print(f"{'='*80}\n")
    for s in stop_index:
        num = s.get("stopnumber") or "?"
        de = s.get("title_de", "")
        en = s.get("title_en", "")
        title_str = f"{de}" if de == en else f"{de} / {en}"
        img = "IMG" if s.get("image") else "   "
        aud_de = "DE" if s.get("audio_de") else "  "
        aud_en = "EN" if s.get("audio_en") else "  "
        print(f"  Stop {str(num):>4}  [{img}] [{aud_de}|{aud_en}]  {title_str}")

    print(f"\n{'='*80}")
    print(f"GALLERIES")
    print(f"{'='*80}\n")
    for g in gallery_index:
        de = g.get("title_de", "")
        en = g.get("title_en", "")
        n_obj = len(g.get("objects", []))
        print(f"  {de} / {en}  ({n_obj} objects)")

    print(f"\n{'='*80}")
    print(f"INFO PAGES")
    print(f"{'='*80}\n")
    for p in info_index:
        de = p.get("title_de", "")
        en = p.get("title_en", "")
        print(f"  {de} / {en}")


if __name__ == "__main__":
    main()
