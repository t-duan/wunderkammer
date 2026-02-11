"""
Full scrape of friedenstein.app API data.
Fetches all entities, then fetches each one individually for full detail.
Saves everything as JSON locally.
"""
import json
import urllib.request
import urllib.error
import os
import time

BASE = "https://v3.rest.delivery.tapart.me/api"
OUT_DIR = "/home/td/wunderkammer/friedenstein_data"

ENDPOINTS = {
    "entities": f"{BASE}/friedenstein-stiftung/spaces/1/entities",
    "languages": f"{BASE}/friedenstein-stiftung/spaces/1/languages",
    "mediaguide_entities": f"{BASE}/mediaguide/spaces/1/entities",
}


def fetch_json(url):
    """Fetch JSON from a URL, return parsed data."""
    req = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        print(f"  HTTP {e.code} for {url}")
        return None
    except Exception as e:
        print(f"  Error fetching {url}: {e}")
        return None


def save_json(data, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def main():
    os.makedirs(OUT_DIR, exist_ok=True)

    # 1. Fetch top-level endpoints
    for name, url in ENDPOINTS.items():
        print(f"Fetching {name}...")
        data = fetch_json(url)
        if data:
            save_json(data, os.path.join(OUT_DIR, f"{name}.json"))
            print(f"  Saved {name}.json")
            if isinstance(data, list):
                print(f"  {len(data)} items")
        else:
            print(f"  Failed to fetch {name}")

    # 2. Load main entities and fetch each one individually
    entities_path = os.path.join(OUT_DIR, "entities.json")
    if not os.path.exists(entities_path):
        print("No entities to process.")
        return

    with open(entities_path, "r") as f:
        entities = json.load(f)

    print(f"\n--- Fetching {len(entities)} individual entities ---")
    details_dir = os.path.join(OUT_DIR, "entities_detail")
    os.makedirs(details_dir, exist_ok=True)

    for i, entity in enumerate(entities):
        uuid = entity.get("uuid", "")
        title = entity.get("title", "unknown")
        slug = entity.get("contentTypeSlug", "unknown")
        if not uuid:
            continue

        detail_url = f"{BASE}/friedenstein-stiftung/spaces/1/entities/{uuid}"
        safe_title = "".join(c if c.isalnum() or c in "-_ " else "" for c in title).strip()[:60]
        filename = f"{slug}__{safe_title}__{uuid[:8]}.json"

        print(f"  [{i+1}/{len(entities)}] {title}")
        detail = fetch_json(detail_url)
        if detail:
            save_json(detail, os.path.join(details_dir, filename))
        time.sleep(0.1)  # be polite

    # 3. Also fetch mediaguide entities individually
    mg_path = os.path.join(OUT_DIR, "mediaguide_entities.json")
    if os.path.exists(mg_path):
        with open(mg_path, "r") as f:
            mg_entities = json.load(f)

        print(f"\n--- Fetching {len(mg_entities)} mediaguide entities ---")
        mg_dir = os.path.join(OUT_DIR, "mediaguide_detail")
        os.makedirs(mg_dir, exist_ok=True)

        for i, entity in enumerate(mg_entities):
            uuid = entity.get("uuid", "")
            title = entity.get("title", "unknown")
            if not uuid:
                continue
            detail_url = f"{BASE}/mediaguide/spaces/1/entities/{uuid}"
            safe_title = "".join(c if c.isalnum() or c in "-_ " else "" for c in title).strip()[:60]
            filename = f"{safe_title}__{uuid[:8]}.json"
            print(f"  [{i+1}/{len(mg_entities)}] {title}")
            detail = fetch_json(detail_url)
            if detail:
                save_json(detail, os.path.join(mg_dir, filename))
            time.sleep(0.1)

    # 4. Print summary
    print("\n=== SUMMARY ===")
    for root, dirs, files in os.walk(OUT_DIR):
        level = root.replace(OUT_DIR, "").count(os.sep)
        indent = "  " * level
        print(f"{indent}{os.path.basename(root)}/")
        if level < 2:
            for f in sorted(files)[:10]:
                size = os.path.getsize(os.path.join(root, f))
                print(f"{indent}  {f} ({size:,} bytes)")
            if len(files) > 10:
                print(f"{indent}  ... and {len(files)-10} more files")
            print(f"{indent}  Total: {len(files)} files")


if __name__ == "__main__":
    main()
