#!/usr/bin/env python3
"""
Digi-games — sitemap.xml generator.

Regenerates sitemap.xml at the repo root from data/games.json plus the
two static pages. Run after any change to games.json, alongside
generate_pages.py:

    python3 scripts/generate_pages.py
    python3 scripts/generate_sitemap.py
"""
import json
import os
from datetime import date, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_PATH = os.path.join(ROOT, "data", "games.json")
OUT_PATH = os.path.join(ROOT, "sitemap.xml")

SITE_URL = "https://aesmaeily.github.io/GameStoryHub"


def url_entry(loc, priority, changefreq, lastmod):
    return (
        "  <url>\n"
        f"    <loc>{loc}</loc>\n"
        f"    <lastmod>{lastmod}</lastmod>\n"
        f"    <changefreq>{changefreq}</changefreq>\n"
        f"    <priority>{priority}</priority>\n"
        "  </url>\n"
    )


def main():
    with open(DATA_PATH, encoding="utf-8") as f:
        games = json.load(f)

    today = date.today().isoformat()

    entries = [
        url_entry(f"{SITE_URL}/", "1.0", "weekly", today),
        url_entry(f"{SITE_URL}/browse.html", "0.9", "weekly", today),
        url_entry(f"{SITE_URL}/deals.html", "0.8", "daily", today),
    ]
    for g in sorted(games, key=lambda x: x["slug"]):
        entries.append(url_entry(f"{SITE_URL}/games/{g['slug']}.html", "0.7", "monthly", today))

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "".join(entries)
        + "</urlset>\n"
    )

    with open(OUT_PATH, "w", encoding="utf-8") as f:
        f.write(xml)

    print(f"Generated sitemap.xml with {len(entries)} URLs ({datetime.now().isoformat(timespec='seconds')})")


if __name__ == "__main__":
    main()
