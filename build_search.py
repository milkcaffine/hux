#!/usr/bin/env python3
"""
build_search.py - Generates js/posts-data.js for mindsoap search index.
Scans all post HTML files in 202* directories and extracts metadata.
"""

import os
import glob
import re
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
POSTS_PATTERN = os.path.join(SCRIPT_DIR, "202*", "*.html")
OUTPUT_JS = os.path.join(SCRIPT_DIR, "js", "posts-data.js")

LEGACY_CATEGORIES = {
    "/2024/2024-05-13.html": "E-reader",
    "/2024/2024-06-01.html": "E-reader",
    "/2024/2024-10-13.html": "E-reader",
    "/2025/2025-02-15.html": "E-reader",
    "/2025/2025-03-04.html": "E-reader",
    "/2025/2025-07-30.html": "E-reader",
    "/2025/2025-08-20.html": "E-reader",
    "/2025/2025-09-07.html": "E-reader",
    "/2025/2025-09-23.html": "E-reader",
    "/2025/2025-11-20.html": "E-reader",
    "/2026/2026-11-04.html": "E-reader",
    "/2024/2024-10-09.html": "iPod",
    "/2025/2025-08-21.html": "iPod",
    "/2025/2025-09-27.html": "iPod",
    "/2025/2025-12-14.html": "iPod",
    "/2026/2026-01-06.html": "iPod",
    "/2025/2025-10-06.html": "Raspberry Pi",
    "/2025/2025-10-07.html": "Raspberry Pi",
    "/2025/2025-12-01.html": "Raspberry Pi",
    "/2025/2025-12-13.html": "Raspberry Pi",
    "/2026/2026-10-31.html": "Raspberry Pi",
    "/2024/2024-05-15.html": "Audio",
    "/2024/2024-06-01-2nd.html": "Audio",
    "/2024/2024-07-01.html": "Audio",
    "/2024/2024-07-26.html": "Audio",
    "/2025/2025-05-30.html": "Audio",
    "/2024/2024-05-23.html": "Things",
    "/2024/2024-07-05.html": "Things",
    "/2024/2024-07-16.html": "Things",
    "/2024/2024-07-09.html": "Things",
    "/2025/2025-02-11.html": "Things",
    "/2024/2024-06-14.html": "Pens",
    "/2025/2025-03-03.html": "Pens",
    "/2026/2026-10-04.html": "Film cameras",
    "/2024/2024-05-11.html": "etc",
    "/2024/2024-05-21.html": "etc",
    "/2025/2025-07-31.html": "etc",
    "/2025/2025-12-03.html": "etc",
    "/2026/2026-10-29.html": "etc",
    "/2026/2026-10-31-2nd.html": "etc",
}

def infer_category(rel_path, html, title, desc, body_text):
    if rel_path in LEGACY_CATEGORIES:
        return LEGACY_CATEGORIES[rel_path]
    badge_match = re.search(r'class=[\"\']badge-category[\"\']>([^<]+)<', html)
    if badge_match:
        return badge_match.group(1).strip()
    combined = f"{title} {desc} {body_text}".lower()
    if any(k in combined for k in ["kindle", "킨들", "kobo", "코리더", "koreader", "kual"]):
        return "E-reader"
    if any(k in combined for k in ["ipod", "아이팟"]):
        return "iPod"
    if any(k in combined for k in ["raspberry", "라즈베리", "pico w", "피코 w", "nextcloud"]):
        return "Raspberry Pi"
    if any(k in combined for k in ["dac", "dap", "iem", "xm5", "xm6", "headphone", "이어폰", "헤드폰"]):
        return "Audio"
    if any(k in combined for k in ["montblanc", "kakimori", "만년필", "딥펜"]):
        return "Pens"
    if any(k in combined for k in ["렌즈", "카메라", "camera", "lens"]):
        return "Film cameras"
    return "etc"

def clean_html(raw_html):
    """Remove HTML tags and extra whitespace."""
    clean = re.sub(r'<script.*?</script>', '', raw_html, flags=re.DOTALL)
    clean = re.sub(r'<style.*?</style>', '', clean, flags=re.DOTALL)
    clean = re.sub(r'<[^<]+?>', ' ', clean)
    clean = re.sub(r'&[a-zA-Z0-9#]+;', ' ', clean)
    clean = re.sub(r'\s+', ' ', clean)
    return clean.strip()

def extract_post_data(file_path):
    with open(file_path, "r", encoding="utf-8") as f:
        html = f.read()

    rel_path = "/" + os.path.relpath(file_path, SCRIPT_DIR)

    # 1. Date from filename (YYYY-MM-DD)
    fname = os.path.basename(file_path)
    date_match = re.search(r'(\d{4}-\d{2}-\d{2})', fname)
    date = date_match.group(1) if date_match else ""

    # 2. Title from <title> or <h1>
    title_match = re.search(r'<title>(.*?)</title>', html, re.IGNORECASE | re.DOTALL)
    if title_match:
        title = title_match.group(1).strip()
        title = re.sub(r'\s*[—–-]\s*mindsoap.*$', '', title).strip()
    else:
        h1_match = re.search(r'<h1[^>]*>(.*?)</h1>', html, re.IGNORECASE | re.DOTALL)
        if h1_match:
            title = clean_html(h1_match.group(1))
            title = re.sub(r'\d{4}-\d{2}-\d{2}', '', title).strip()
        else:
            title = fname.replace(".html", "")

    # 3. Description from <meta name="description">
    desc_match = re.search(r'<meta\s+name=[\"\']description[\"\']\s+content=[\"\'](.*?)[\"\']', html, re.IGNORECASE)
    desc = desc_match.group(1).strip() if desc_match else ""

    # 4. Body excerpt for rich keyword search
    body_match = re.search(r'<div class=[\"\']post[\"\']>(.*?)</div>', html, re.DOTALL)
    if body_match:
        body_text = clean_html(body_match.group(1))[:300]
    else:
        body_text = clean_html(html)[:300]

    # 5. Category
    category = infer_category(rel_path, html, title, desc, body_text)

    return {
        "title": title,
        "date": date,
        "url": rel_path,
        "category": category,
        "desc": desc,
        "body": body_text
    }

def main():
    files = sorted(glob.glob(POSTS_PATTERN), reverse=True)

    posts = []
    for f in files:
        post = extract_post_data(f)
        posts.append(post)

    # Sort posts by date descending
    posts.sort(key=lambda x: (x["date"], x["url"]), reverse=True)

    os.makedirs(os.path.dirname(OUTPUT_JS), exist_ok=True)
    with open(OUTPUT_JS, "w", encoding="utf-8") as f:
        f.write("/* Auto-generated by build_search.py - do not edit directly */\n")
        f.write("window.MINDSOAP_POSTS = ")
        json.dump(posts, f, ensure_ascii=False, indent=2)
        f.write(";\n")

    print(f"Successfully generated {OUTPUT_JS} with {len(posts)} posts.")

if __name__ == "__main__":
    main()
