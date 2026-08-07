#!/usr/bin/env python3
"""Generate static month archive pages (e.g. 2021/01/) for sidebar Archives links."""
from __future__ import annotations

import re
import sys
from datetime import datetime
from html import escape
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import SITE_OUT

ARTICLE_RE = re.compile(
    r"<article\b[^>]*\btype-post\b[^>]*>.*?</article>",
    re.I | re.S,
)
DATETIME_RE = re.compile(
    r'<time class="published"[^>]*datetime="([^"]+)"',
    re.I,
)
ARCHIVE_LINK_RE = re.compile(
    r'href="(?:/paresearchcenter)?/(\d{4})/(\d{2})/"[^>]*>([^<]+)</a>',
    re.I,
)
SITE_BASE_RE = re.compile(r'<meta name="site-base" content="([^"]*)">', re.I)
TITLE_RE = re.compile(r"<title>([^<]+)</title>", re.I)
MASONRY_RE = re.compile(
    r'(<div class="content-masonry" id="content-masonry"[^>]*>)(.*?)(</div>\s*<!--\s*content-masonry\s*-->)',
    re.I | re.S,
)


def site_base_from(html: str) -> str:
    match = SITE_BASE_RE.search(html)
    return match.group(1).rstrip("/") if match else ""


def prefix(url: str, site_base: str) -> str:
    path = url if url.startswith("/") else f"/{url}"
    return f"{site_base}{path}" if site_base else path


def collect_posts(site_root: Path) -> dict[tuple[int, int], list[str]]:
    """Map (year, month) -> article HTML from blog listing pages."""
    grouped: dict[tuple[int, int], list[tuple[datetime, str]]] = {}
    for path in sorted(site_root.rglob("*.html")):
        rel = path.relative_to(site_root).as_posix()
        if not rel.startswith("blog/"):
            continue
        html = path.read_text(encoding="utf-8", errors="replace")
        for article in ARTICLE_RE.findall(html):
            dt_match = DATETIME_RE.search(article)
            if not dt_match:
                continue
            dt = datetime.fromisoformat(dt_match.group(1))
            grouped.setdefault((dt.year, dt.month), []).append((dt, article))

    return {
        key: [article for _, article in sorted(items, reverse=True)]
        for key, items in grouped.items()
    }


def archive_months_from_sidebar(template_html: str) -> list[tuple[int, int, str]]:
    months: list[tuple[int, int, str]] = []
    seen: set[tuple[int, int]] = set()
    for year_s, month_s, label in ARCHIVE_LINK_RE.findall(template_html):
        key = (int(year_s), int(month_s))
        if key in seen:
            continue
        seen.add(key)
        months.append((key[0], key[1], label.strip()))
    return months


def build_page(
    template_html: str,
    *,
    year: int,
    month: int,
    label: str,
    articles: list[str],
    site_base: str,
) -> str:
    title = f"{label} – Physical Activity Research Center"
    canonical = prefix(f"/{year:04d}/{month:02d}/", site_base)
    page_header = (
        '<header class="page-header pad-container" itemscope="" '
        'itemtype="http://schema.org/WebPageElement">\n'
        f'<h1 class="page-title" itemprop="headline">Month: <span>{escape(label)}</span></h1> '
        "</header><!-- .page-header -->\n"
    )
    masonry_body = "\n".join(articles) if articles else (
        '<p class="pad-container">No posts found for this month.</p>'
    )

    html = template_html
    html = TITLE_RE.sub(f"<title>{escape(title)}</title>", html, count=1)
    html = html.replace(
        '<body class="',
        '<body class="archive date ',
        1,
    )
    if 'rel="canonical"' not in html:
        html = html.replace(
            '<meta name="site-base"',
            f'<link rel="canonical" href="{escape(canonical)}">\n<meta name="site-base"',
            1,
        )

    def replace_masonry(match: re.Match[str]) -> str:
        return f"{match.group(1)}\n{page_header}{masonry_body}\n{match.group(3)}"

    html, n = MASONRY_RE.subn(replace_masonry, html, count=1)
    if n != 1:
        raise SystemExit("Could not patch content-masonry in blog template")
    return html


def build_archives(site_root: Path = SITE_OUT) -> list[Path]:
    template_path = site_root / "blog" / "index.html"
    if not template_path.is_file():
        raise SystemExit(f"Missing blog template: {template_path}")

    template_html = template_path.read_text(encoding="utf-8")
    site_base = site_base_from(template_html)
    posts_by_month = collect_posts(site_root)
    sidebar_months = archive_months_from_sidebar(template_html)

    written: list[Path] = []
    for year, month, label in sidebar_months:
        articles = posts_by_month.get((year, month), [])
        out_dir = site_root / f"{year:04d}" / f"{month:02d}"
        out_dir.mkdir(parents=True, exist_ok=True)
        out_path = out_dir / "index.html"
        out_path.write_text(
            build_page(
                template_html,
                year=year,
                month=month,
                label=label,
                articles=articles,
                site_base=site_base,
            ),
            encoding="utf-8",
        )
        written.append(out_path)
    return written


def main() -> None:
    paths = build_archives()
    print(f"Wrote {len(paths)} archive pages under {SITE_OUT}")


if __name__ == "__main__":
    main()
