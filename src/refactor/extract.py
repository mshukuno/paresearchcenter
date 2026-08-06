"""Phase 2–3: extract shared partials and per-page content from HTML."""
from __future__ import annotations

import json
import re
from dataclasses import asdict, dataclass
from pathlib import Path

from bs4 import BeautifulSoup

from .config import CONTENT_DIR, PARTIALS_DIR, REFERENCE_PAGE, SITE_SRC


@dataclass
class PageContent:
    source: str
    title: str
    canonical: str
    body_class: str
    breadcrumbs: str
    container: str


def _element_html(tag) -> str:
    if tag is None:
        return ""
    return str(tag)


def _normalize_nav(html: str) -> str:
    """Remove active-menu markers so the partial works on every page."""
    html = re.sub(r'\s*current-menu-item\b', "", html)
    html = re.sub(r'\s*current_page_item\b', "", html)
    html = re.sub(r'\s*current-menu-ancestor\b', "", html)
    html = re.sub(r'\s*current_page_ancestor\b', "", html)
    html = re.sub(r'\s*aria-current="page"', "", html)
    return html


def extract_partials(reference: Path = REFERENCE_PAGE) -> dict[str, str]:
    """Extract shared chrome from a reference page into partial files."""
    soup = BeautifulSoup(reference.read_text(encoding="utf-8"), "html.parser")

    head = soup.find("head")
    title_tag = head.find("title") if head else None
    canonical_tag = head.find("link", rel="canonical") if head else None

    head_assets: list[str] = []
    if head:
        for child in head.children:
            name = getattr(child, "name", None)
            if name == "title":
                continue
            if name == "link" and child.get("rel") == ["canonical"]:
                continue
            if name == "meta":
                if child.get("charset"):
                    continue
                if (child.get("http-equiv") or "").lower() == "x-ua-compatible":
                    continue
                if child.get("name") == "viewport":
                    continue
            if name:
                head_assets.append(str(child))
            elif str(child).strip():
                head_assets.append(str(child))

    header = soup.find("header", id="masthead")
    colophon = soup.find("aside", id="colophon")
    footer = soup.find("footer", id="footer")

    body = soup.find("body")
    site_wrapper = body.find(id="site-wrapper") if body else None
    body_scripts: list[str] = []
    if body and site_wrapper:
        for sibling in site_wrapper.next_siblings:
            chunk = str(sibling).strip()
            if chunk:
                body_scripts.append(chunk)

    partials = {
        "head-assets.html": "\n".join(head_assets),
        "header.html": _normalize_nav(_element_html(header)),
        "colophon.html": _element_html(colophon),
        "footer.html": _element_html(footer),
        "body-scripts.html": "\n".join(body_scripts),
        "_meta.json": json.dumps(
            {
                "reference": reference.relative_to(SITE_SRC.parent).as_posix()
                if reference.is_relative_to(SITE_SRC.parent)
                else str(reference),
                "sample_title": title_tag.get_text(strip=True) if title_tag else "",
            },
            indent=2,
        ),
    }

    PARTIALS_DIR.mkdir(parents=True, exist_ok=True)
    for name, content in partials.items():
        (PARTIALS_DIR / name).write_text(content.strip() + "\n", encoding="utf-8")

    return partials


def extract_page_content(html_path: Path) -> PageContent:
    """Extract page-specific fields from one HTML file."""
    soup = BeautifulSoup(html_path.read_text(encoding="utf-8"), "html.parser")

    head = soup.find("head")
    title = head.find("title").get_text(strip=True) if head and head.find("title") else ""
    canonical_tag = head.find("link", rel="canonical") if head else None
    canonical = canonical_tag.get("href", "") if canonical_tag else ""

    body = soup.find("body")
    body_class = " ".join(body.get("class", [])) if body else ""

    breadcrumbs_el = soup.find(id="breadcrumbs-container")
    container_el = soup.find(id="container")

    rel = html_path.relative_to(SITE_SRC).as_posix()
    return PageContent(
        source=rel,
        title=title,
        canonical=canonical,
        body_class=body_class,
        breadcrumbs=_element_html(breadcrumbs_el),
        container=_element_html(container_el),
    )


def save_page_content(content: PageContent) -> Path:
    CONTENT_DIR.mkdir(parents=True, exist_ok=True)
    out = CONTENT_DIR / (content.source.replace("/", "__") + ".json")
    out.write_text(json.dumps(asdict(content), indent=2), encoding="utf-8")
    return out


def extract_all_content() -> list[PageContent]:
    pages: list[PageContent] = []
    for path in sorted(SITE_SRC.rglob("*.html")):
        rel = path.relative_to(SITE_SRC).as_posix()
        if rel.startswith(("wp-includes/", "wp-admin/", "wp-content/plugins/")):
            continue
        content = extract_page_content(path)
        save_page_content(content)
        pages.append(content)
    return pages
