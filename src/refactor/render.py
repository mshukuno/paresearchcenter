"""Phase 3: render slim HTML pages from templates + extracted content."""
from __future__ import annotations

from datetime import date
from pathlib import Path

from jinja2 import Environment, FileSystemLoader, select_autoescape

from . import config
from .config import CONTENT_DIR, PARTIALS_DIR, SITE_OUT, SITE_SRC, TEMPLATES_DIR
from .assets import sync_assets
from .extract import PageContent, extract_page_content, save_page_content


def _env() -> Environment:
    env = Environment(
        loader=FileSystemLoader([str(TEMPLATES_DIR), str(PARTIALS_DIR)]),
        autoescape=select_autoescape(["html", "xml"]),
        keep_trailing_newline=True,
    )
    env.globals["current_year"] = date.today().year
    env.globals["copyright_start_year"] = 2018
    return env


def _load_content(page_rel: str) -> PageContent:
    json_path = CONTENT_DIR / (page_rel.replace("/", "__") + ".json")
    if json_path.exists():
        import json

        data = json.loads(json_path.read_text(encoding="utf-8"))
        return PageContent(**data)

    html_path = SITE_SRC / page_rel
    content = extract_page_content(html_path)
    save_page_content(content)
    return content


def render_page(page_rel: str, out_root: Path = SITE_OUT) -> Path:
    """Render one page. page_rel e.g. 'about-us/index.html'."""
    content = _load_content(page_rel)
    env = _env()
    template = env.get_template("page.html")

    html = template.render(
        title=content.title,
        canonical=content.canonical,
        body_class=content.body_class,
        breadcrumbs=content.breadcrumbs,
        container=content.container,
    )

    out_path = out_root / page_rel
    if config.DRY_RUN:
        print(f"[DRY RUN] Would write {out_path} ({len(html.splitlines())} lines)")
        return out_path

    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(html, encoding="utf-8")
    return out_path


def render_all(out_root: Path = SITE_OUT, *, sync_static: bool = True) -> list[Path]:
    rendered: list[Path] = []
    for json_file in sorted(CONTENT_DIR.glob("*.json")):
        page_rel = json_file.stem.replace("__", "/")
        if not page_rel.endswith(".html"):
            page_rel += ".html"
        rendered.append(render_page(page_rel, out_root))
    if sync_static:
        sync_assets(out_root)
    return rendered


def compare_sizes(page_rel: str) -> tuple[int, int]:
    src = SITE_SRC / page_rel
    out = SITE_OUT / page_rel
    src_lines = len(src.read_text(encoding="utf-8").splitlines()) if src.exists() else 0
    out_lines = len(out.read_text(encoding="utf-8").splitlines()) if out.exists() else 0
    return src_lines, out_lines
