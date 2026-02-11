"""
Download all images and audio files from the Friedenstein media guide.
Reads from the index JSON and saves media locally.
"""
import json
import os
import urllib.request
import urllib.error
import time
import sys

DATA_DIR = "/home/td/wunderkammer/friedenstein_data"
MEDIA_DIR = os.path.join(DATA_DIR, "media")
IMG_DIR = os.path.join(MEDIA_DIR, "images")
AUDIO_DE_DIR = os.path.join(MEDIA_DIR, "audio_de")
AUDIO_EN_DIR = os.path.join(MEDIA_DIR, "audio_en")


def download(url, dest):
    """Download a file if it doesn't already exist."""
    if os.path.exists(dest) and os.path.getsize(dest) > 0:
        return "skip"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            with open(dest, "wb") as f:
                while True:
                    chunk = resp.read(65536)
                    if not chunk:
                        break
                    f.write(chunk)
        return "ok"
    except Exception as e:
        print(f"    FAILED: {e}")
        return "fail"


def safe_filename(stopnumber, title, ext):
    num = str(stopnumber) if stopnumber else "xx"
    safe = "".join(c if c.isalnum() or c in "-_ " else "" for c in title).strip()[:80]
    return f"{num.zfill(3)}_{safe}.{ext}"


def main():
    for d in [IMG_DIR, AUDIO_DE_DIR, AUDIO_EN_DIR]:
        os.makedirs(d, exist_ok=True)

    with open(os.path.join(DATA_DIR, "friedenstein_index.json"), "r") as f:
        index = json.load(f)

    stops = index["stops"]
    total = len(stops)
    stats = {"img_ok": 0, "img_skip": 0, "img_fail": 0,
             "aud_ok": 0, "aud_skip": 0, "aud_fail": 0}

    for i, stop in enumerate(stops):
        num = stop.get("stopnumber")
        title = stop.get("title_en") or stop.get("title_de") or "unknown"
        print(f"[{i+1}/{total}] Stop {num or '?'}: {title}")

        # Image
        img = stop.get("image")
        if img and img.get("url"):
            ext = img.get("filename", "image.jpg").rsplit(".", 1)[-1]
            dest = os.path.join(IMG_DIR, safe_filename(num, title, ext))
            result = download(img["url"], dest)
            stats[f"img_{result}"] += 1
            if result == "ok":
                size_kb = os.path.getsize(dest) / 1024
                print(f"  IMG: {size_kb:.0f}KB -> {os.path.basename(dest)}")
            elif result == "skip":
                print(f"  IMG: already exists")

        # Audio DE
        aud_de = stop.get("audio_de")
        if aud_de and aud_de.get("url"):
            ext = aud_de.get("filename", "audio.mp3").rsplit(".", 1)[-1]
            dest = os.path.join(AUDIO_DE_DIR, safe_filename(num, title, ext))
            result = download(aud_de["url"], dest)
            stats[f"aud_{result}"] += 1
            if result == "ok":
                size_kb = os.path.getsize(dest) / 1024
                print(f"  DE:  {size_kb:.0f}KB -> {os.path.basename(dest)}")
            elif result == "skip":
                print(f"  DE:  already exists")

        # Audio EN
        aud_en = stop.get("audio_en")
        if aud_en and aud_en.get("url"):
            ext = aud_en.get("filename", "audio.mp3").rsplit(".", 1)[-1]
            dest = os.path.join(AUDIO_EN_DIR, safe_filename(num, title, ext))
            result = download(aud_en["url"], dest)
            stats[f"aud_{result}"] += 1
            if result == "ok":
                size_kb = os.path.getsize(dest) / 1024
                print(f"  EN:  {size_kb:.0f}KB -> {os.path.basename(dest)}")
            elif result == "skip":
                print(f"  EN:  already exists")

        time.sleep(0.05)

    print(f"\n{'='*60}")
    print(f"DOWNLOAD COMPLETE")
    print(f"{'='*60}")
    print(f"Images:   {stats['img_ok']} downloaded, {stats['img_skip']} skipped, {stats['img_fail']} failed")
    print(f"Audio:    {stats['aud_ok']} downloaded, {stats['aud_skip']} skipped, {stats['aud_fail']} failed")

    # Print total sizes
    for label, d in [("Images", IMG_DIR), ("Audio DE", AUDIO_DE_DIR), ("Audio EN", AUDIO_EN_DIR)]:
        total_bytes = sum(os.path.getsize(os.path.join(d, f)) for f in os.listdir(d))
        print(f"{label:10s}: {len(os.listdir(d)):3d} files, {total_bytes/1024/1024:.1f} MB")


if __name__ == "__main__":
    main()
