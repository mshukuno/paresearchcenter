"""Rewrite root-absolute URLs for GitHub Pages project sites."""
from __future__ import annotations

import re

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

    def repl(match: re.Match[str]) -> str:
        idx = match.start()
        if idx >= plen and html[idx - plen : idx] == prefix:
            return "/"
        return f"{prefix}/"

    for pattern in _ROOT_SLASH_PATTERNS:
        html = pattern.sub(repl, html)

    # Site root links (canonical, home logo) — after general prefixing.
    html = html.replace('href="/"', f'href="{prefix}/"')
    html = html.replace("href='/'", f"href='{prefix}/'")
    return html
