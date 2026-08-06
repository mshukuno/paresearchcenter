"""Rewrite root-absolute URLs for GitHub Pages project sites."""
from __future__ import annotations

import re
from pathlib import Path

# Match root-absolute paths, but not closing "/>" on HTML tags.
_ROOT_SLASH_PATTERNS = (
    re.compile(r'(?<=")/(?![/])(?=[^">])'),
    re.compile(r"(?<=')/(?![/])(?=[^'>])"),
    re.compile(r'(?<=, )/(?![/])(?=[^">])'),
    re.compile(r'(?<=url\()/(?![/])(?=[^">])'),
)


def prefix_root_paths(html: str, base_path: str) -> str:
    """Prefix site-root paths like /wp-content/... with the Pages base path."""
    if not base_path:
        return html

    prefix = base_path.rstrip("/")
    plen = len(prefix)
    base_name = prefix.lstrip("/")

    def repl(match: re.Match[str]) -> str:
        idx = match.start()
        if idx >= plen and html[idx - plen : idx] == prefix:
            return "/"
        # Already prefixed (/paresearchcenter/... or content="/paresearchcenter").
        if html[idx + 1 :].startswith(base_name):
            return "/"
        return f"{prefix}/"

    for pattern in _ROOT_SLASH_PATTERNS:
        html = pattern.sub(repl, html)

    # Site root links (canonical, home logo) — after general prefixing.
    html = html.replace('href="/"', f'href="{prefix}/"')
    html = html.replace("href='/'", f"href='{prefix}/'")
    return html


def prefix_css_files(out_root: Path, base_path: str) -> int:
    """Prefix root-absolute url(/...) paths inside deployed CSS files."""
    if not base_path:
        return 0

    updated = 0
    for path in out_root.rglob("*.css"):
        text = path.read_text(encoding="utf-8")
        fixed = prefix_root_paths(text, base_path)
        if fixed != text:
            path.write_text(fixed, encoding="utf-8")
            updated += 1
    return updated
