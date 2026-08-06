#!/usr/bin/env python3
"""Patch dist/search/index.html to use blog-layout search results."""
from __future__ import annotations

import re
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import SITE_OUT


def extract_primary_sidebar(blog_html: str) -> str:
    match = re.search(
        r'<aside class="widget-area sidey" id="primary"[^>]*>.*?</aside>',
        blog_html,
        re.I | re.S,
    )
    return match.group(0) if match else ""


def patch_search_page(site_root: Path = SITE_OUT) -> None:
    search_path = site_root / "search" / "index.html"
    blog_path = site_root / "blog" / "index.html"
    if not search_path.is_file():
        raise SystemExit(f"Missing {search_path}")

    html = search_path.read_text(encoding="utf-8")
    blog_html = blog_path.read_text(encoding="utf-8") if blog_path.is_file() else ""
    sidebar = extract_primary_sidebar(blog_html)
    if sidebar:
        sidebar = re.sub(
            r'<form action="[^"]*" class="searchform"',
            '<form action="/paresearchcenter/search/" class="searchform"',
            sidebar,
            count=1,
        )

    container = f"""<div class="two-columns-left" id="container">
<main class="main" id="main" role="main">
<header class="page-header pad-container" itemscope="" itemtype="http://schema.org/WebPageElement">
<h1 class="page-title" id="site-search-heading" itemprop="headline">Search</h1>
</header><!-- .page-header -->
<form action="/paresearchcenter/search/" class="searchform" method="get" role="search">
<label>
<span class="screen-reader-text">Search for:</span>
<input class="s" name="s" placeholder="Search" type="search" value=""/>
</label>
<button class="searchsubmit" type="submit"><span class="screen-reader-text">Search</span><i class="icon-search"></i></button>
</form>
<div class="content-masonry" id="content-masonry" itemscope="" itemtype="http://schema.org/Blog">
</div>
<div id="site-search-pagination"></div>
</main><!-- #main -->
{sidebar}
</div>"""

    html = re.sub(
        r'<div class="cryout one-column" id="breadcrumbs-container">.*?</div>\s*(?=<div id="content")',
        '<div class="cryout two-columns-left" id="breadcrumbs-container"><div id="breadcrumbs-container-inside"><div id="breadcrumbs"> <nav id="breadcrumbs-nav"><a href="/paresearchcenter/" title="Home"><i class="icon-bread-home"></i><span class="screen-reader-text">Home</span></a><i class="icon-bread-arrow"></i> <span class="current" id="site-search-breadcrumb">Search</span></nav></div></div></div>\n',
        html,
        count=1,
        flags=re.S,
    )

    html = re.sub(
        r'<div class="(?:one-column|two-columns-left)" id="container">.*?</div>\s*(?=<aside id="colophon")',
        container + "\n",
        html,
        count=1,
        flags=re.S,
    )

    html = re.sub(
        r'<body class="[^"]*"\s+itemscope',
        '<body class="search search-results wp-embed-responsive wp-theme-septera wp-child-theme-septera-child do-etfw metaslider-plugin septera-image-none septera-caption-zero septera-totop-normal septera-no-table septera-fixed-menu septera-over-menu septera-menu-center septera-responsive-headerimage septera-responsive-featured septera-magazine-one septera-magazine-layout septera-comment-placeholder septera-hide-page-title septera-elementshadow septera-normalizedtags septera-article-animation-2" itemscope',
        html,
        count=1,
    )

    search_path.write_text(html, encoding="utf-8")
    print(f"Patched {search_path}")


def main() -> None:
    patch_search_page()


if __name__ == "__main__":
    main()
