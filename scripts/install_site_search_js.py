#!/usr/bin/env python3
"""Install shared site-search.js and script tags into rendered HTML pages."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import SITE_OUT

SCRIPT_NAME = "site-search.js"
SCRIPT_TAG = '<script defer src="{base}/{name}"></script>'
INLINE_SEARCH_ID = "site-search-js"


def site_base_from_html(html: str) -> str:
    match = re.search(r'<meta name="site-base" content="([^"]*)"', html)
    return match.group(1) if match else "/paresearchcenter"


def install(site_root: Path = SITE_OUT) -> int:
    script_src = Path(__file__).resolve().parent / SCRIPT_NAME
    if not script_src.is_file():
        raise SystemExit(f"Missing {script_src}. Add {SCRIPT_NAME} next to this script.")

    site_root.mkdir(parents=True, exist_ok=True)
    (site_root / SCRIPT_NAME).write_text(script_src.read_text(encoding="utf-8"), encoding="utf-8")

    updated = 0
    for path in sorted(site_root.rglob("*.html")):
        rel = path.relative_to(site_root).as_posix()
        if rel.startswith(("wp-content/", "wp-includes/")):
            continue

        html = path.read_text(encoding="utf-8")
        base = site_base_from_html(html)
        tag = SCRIPT_TAG.format(base=base.rstrip("/"), name=SCRIPT_NAME)

        html = re.sub(
            rf'\s*<script[^>]*id="{INLINE_SEARCH_ID}"[^>]*>.*?</script>\s*',
            "\n",
            html,
            flags=re.I | re.S,
        )
        html = re.sub(
            rf'\s*<script defer src="[^"]*/{re.escape(SCRIPT_NAME)}"[^>]*></script>\s*',
            "\n",
            html,
            flags=re.I,
        )

        if tag not in html:
            if "</body>" in html:
                html = html.replace("</body>", f"\n{tag}\n</body>", 1)
                path.write_text(html, encoding="utf-8")
                updated += 1

    return updated


def main() -> None:
    count = install()
    print(f"Installed {SCRIPT_NAME} into {SITE_OUT} ({count} HTML pages updated)")


if __name__ == "__main__":
    main()
