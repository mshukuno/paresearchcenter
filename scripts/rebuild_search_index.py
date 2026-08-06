#!/usr/bin/env python3
"""Rebuild search-index.json from rendered HTML in dist/ (or PARC_SITE_OUT)."""
from __future__ import annotations

import json
import re
import sys
from html import unescape
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import SITE_OUT

SKIP_PREFIXES = ("wp-content/", "wp-includes/", "search/")
TAG_RE = re.compile(r"<[^>]+>")
WS_RE = re.compile(r"\s+")


def page_url(path: Path, site_root: Path) -> str:
    rel = path.relative_to(site_root).as_posix()
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def page_title(html: str) -> str:
    match = re.search(r"<title>([^<]+)</title>", html, re.I)
    if not match:
        return ""
    title = unescape(match.group(1).strip())
    for suffix in (" – Physical Activity Research Center", " - Physical Activity Research Center"):
        if title.endswith(suffix):
            title = title[: -len(suffix)]
    return title.strip()


def main_html(html: str) -> str:
    match = re.search(r'<main[^>]*\bid="main"[^>]*>(.*?)</main>', html, re.I | re.S)
    return match.group(1) if match else ""


def main_text(main: str) -> str:
    parts = re.findall(
        r'<div class="entry-content"[^>]*>(.*?)</div>\s*<!-- \.entry-content -->',
        main,
        re.I | re.S,
    )
    if not parts:
        parts = [main]
    text = " ".join(unescape(TAG_RE.sub(" ", part)) for part in parts)
    return WS_RE.sub(" ", text).strip()


def first_meta(main: str, pattern: str) -> str:
    match = re.search(pattern, main, re.I | re.S)
    return unescape(match.group(1).strip()) if match else ""


def page_type(html: str) -> str:
    if re.search(r"\btype-post\b", html):
        return "post"
    if re.search(r"\btype-page\b", html):
        return "page"
    return "page"


def make_excerpt(text: str, limit: int = 320) -> str:
    if len(text) <= limit:
        return text
    return text[: limit - 1].rsplit(" ", 1)[0] + "…"


def rebuild(site_root: Path = SITE_OUT) -> Path:
    if not site_root.is_dir():
        raise SystemExit(f"Site output not found: {site_root}")

    entries: list[dict[str, str]] = []
    for path in sorted(site_root.rglob("*.html")):
        rel = path.relative_to(site_root).as_posix()
        if rel.startswith(SKIP_PREFIXES):
            continue
        if rel == "404.html":
            continue

        html = path.read_text(encoding="utf-8")
        main = main_html(html)
        title = page_title(html)
        text = main_text(main)
        if not title and not text:
            continue

        entries.append(
            {
                "title": title or rel,
                "url": page_url(path, site_root),
                "text": text,
                "excerpt": make_excerpt(text),
                "author": first_meta(
                    main,
                    r'class="author vcard"[^>]*>.*?itemprop="name"[^>]*>([^<]+)<',
                ),
                "author_url": first_meta(
                    main,
                    r'class="author vcard"[^>]*>.*?rel="author"[^>]*href="([^"]+)"',
                ),
                "date": first_meta(main, r'<time class="published"[^>]*>\s*([^<]+?)\s*</time>'),
                "category": first_meta(main, r'rel="category tag"[^>]*>([^<]+)<'),
                "category_url": first_meta(main, r'rel="category tag"[^>]*href="([^"]+)"'),
                "type": page_type(html),
            }
        )

    out = site_root / "search-index.json"
    out.write_text(json.dumps(entries, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return out


def main() -> None:
    out = rebuild()
    print(f"Wrote {len(json.loads(out.read_text(encoding='utf-8')))} entries to {out}")


if __name__ == "__main__":
    main()
