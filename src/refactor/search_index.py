"""Build a client-side search index from extracted page content."""
from __future__ import annotations

import json
import re
from pathlib import Path

from bs4 import BeautifulSoup

from .config import CONTENT_DIR, SITE_OUT


def _page_url(source: str) -> str:
    rel = source.replace("\\", "/")
    if rel == "index.html":
        return "/"
    if rel.endswith("/index.html"):
        return "/" + rel[: -len("index.html")]
    return "/" + rel


def _plain_text(html: str) -> str:
    return re.sub(r"\s+", " ", BeautifulSoup(html, "html.parser").get_text(" ", strip=True))


def build_search_index(out_root: Path = SITE_OUT) -> Path:
    entries: list[dict[str, str]] = []
    for json_file in sorted(CONTENT_DIR.glob("*.json")):
        if json_file.stem.startswith("search__"):
            continue
        data = json.loads(json_file.read_text(encoding="utf-8"))
        title = data.get("title", "")
        for sep in (" – ", " \u2013 "):
            if sep in title:
                title = title.split(sep, 1)[0]
                break
        entries.append(
            {
                "title": title,
                "url": _page_url(data["source"]),
                "text": _plain_text(data.get("container", ""))[:8000],
            }
        )

    out_path = out_root / "search-index.json"
    out_path.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
    return out_path
