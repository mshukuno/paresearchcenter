#!/usr/bin/env python3
"""
PARC site refactor CLI — run one phase at a time.

Phases:
  1. inventory          Scan site/ and report duplication stats
  2. extract-partials   Pull shared header/footer/head from a reference page
  3. extract-content    Extract per-page content to src/content/
  4. render-page        Build one slim page into dist/
  5. render-all         Build all extracted pages into dist/
  6. sync-assets        Copy wp-content/, wp-includes/ into dist/
  7. build              render-all + sync-assets (full deploy folder)
  8. prune               clean partials, rebuild, delete dead assets
  9. analyze-refs        show referenced vs unreferenced assets in dist/

Examples:
  python src/refactor.py inventory
  python src/refactor.py extract-partials
  python src/refactor.py extract-content --page about-us/index.html
  python src/refactor.py render-page --page about-us/index.html
"""
from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Allow running as `python src/refactor.py` without installing the package.
sys.path.insert(0, str(Path(__file__).resolve().parent))

from refactor import config
from refactor.assets import print_sync_report, sync_assets
from refactor.extract import extract_all_content, extract_page_content, extract_partials, save_page_content
from refactor.inventory import print_report, run_inventory, save_report
from refactor.prune import print_prune_report, run_prune
from refactor.refs import collect_references, dir_size
from refactor.render import compare_sizes, render_all, render_page


def cmd_inventory(_: argparse.Namespace) -> None:
    report = run_inventory()
    print_report(report)
    path = save_report(report)
    print(f"\nSaved detailed inventory to {path}")


def cmd_extract_partials(args: argparse.Namespace) -> None:
    reference = Path(args.reference)
    if not reference.is_absolute():
        reference = config.REPO_ROOT / reference
    partials = extract_partials(reference)
    print(f"Extracted {len(partials)} partials from {reference}")
    for name in sorted(partials):
        if name.startswith("_"):
            continue
        lines = partials[name].count("\n") + 1
        print(f"  src/partials/{name}  ({lines} lines)")


def cmd_extract_content(args: argparse.Namespace) -> None:
    if args.page:
        rel = args.page.replace("\\", "/")
        path = config.SITE_SRC / rel
        content = extract_page_content(path)
        out = save_page_content(content)
        print(f"Extracted {rel} -> {out}")
        print(f"  title: {content.title[:60]}...")
        print(f"  container: {len(content.container.splitlines())} lines")
        return

    pages = extract_all_content()
    print(f"Extracted {len(pages)} pages to {config.CONTENT_DIR}/")


def cmd_render_page(args: argparse.Namespace) -> None:
    rel = args.page.replace("\\", "/")
    if config.DRY_RUN:
        print("DRY_RUN is True — no files will be written.")
    out = render_page(rel)
    src_lines, out_lines = compare_sizes(rel)
    if not config.DRY_RUN and out.exists():
        src_lines, out_lines = compare_sizes(rel)
    print(f"Rendered {rel}")
    print(f"  source: {config.SITE_SRC / rel}  ({src_lines} lines)")
    print(f"  output: {out}  ({out_lines} lines)")
    if src_lines and out_lines:
        saved = src_lines - out_lines
        pct = (saved / src_lines) * 100
        print(f"  saved:  {saved} lines ({pct:.0f}%)")


def cmd_render_all(args: argparse.Namespace) -> None:
    if not config.CONTENT_DIR.exists() or not list(config.CONTENT_DIR.glob("*.json")):
        print("No extracted content found. Run: python src/refactor.py extract-content --all")
        sys.exit(1)
    paths = render_all(sync_static=not args.no_assets)
    print(f"Rendered {len(paths)} pages to {config.SITE_OUT}/")
    if not args.no_assets:
        print("(Assets synced — wp-content/ and wp-includes/ copied into dist/)")


def cmd_sync_assets(_: argparse.Namespace) -> None:
    stats = sync_assets()
    print_sync_report(stats)


def cmd_build(_: argparse.Namespace) -> None:
    if not config.CONTENT_DIR.exists() or not list(config.CONTENT_DIR.glob("*.json")):
        print("No extracted content found. Run: python src/refactor.py extract-content --all")
        sys.exit(1)
    paths = render_all(sync_static=True)
    base = config.SITE_BASE_PATH or "(site root)"
    print(f"Built {len(paths)} pages into {config.SITE_OUT}/ (site base: {base})")
    print("Serve locally:  cd dist && python -m http.server 8000")
    if config.SITE_BASE_PATH:
        print("Local preview note: rebuild with --site-base \"\" for root-absolute paths from dist/.")


def cmd_prune(args: argparse.Namespace) -> None:
    report = run_prune(
        config.SITE_OUT,
        clean=not args.skip_partials,
        rebuild=not args.skip_rebuild,
        uploads=args.uploads,
    )
    print_prune_report(report, config.SITE_OUT)


def cmd_analyze_refs(_: argparse.Namespace) -> None:
    report = collect_references(config.SITE_OUT)
    plugins_dir = config.SITE_OUT / "wp-content/plugins"
    all_plugins = sorted(p.name for p in plugins_dir.iterdir() if p.is_dir()) if plugins_dir.is_dir() else []
    unused = [p for p in all_plugins if p not in report.plugins]

    print("=== Referenced in dist/ HTML ===")
    print("Plugins:", ", ".join(sorted(report.plugins)) or "(none)")
    print("Themes:", ", ".join(sorted(report.themes)) or "(none)")
    print(f"wp-includes URLs: {len(report.includes_urls)}")
    print(f"upload files: {len(report.upload_paths)}")

    print("\n=== Unreferenced plugins ===")
    total = 0.0
    for p in unused:
        n, mb = dir_size(plugins_dir / p)
        total += mb
        print(f"  {p:50} {n:5} files  {mb:6.1f} MB")
    print(f"  TOTAL{'':45} {total:6.1f} MB")

    upload_root = config.SITE_OUT / "wp-content/uploads"
    if upload_root.is_dir():
        all_up = {f.relative_to(upload_root).as_posix() for f in upload_root.rglob("*") if f.is_file()}
        orphan = all_up - report.upload_paths
        orphan_mb = sum((upload_root / p).stat().st_size for p in orphan) / 1024 / 1024
        print(f"\n=== Uploads ===")
        print(f"  Orphan: {len(orphan)} files, {orphan_mb:.1f} MB (use prune --uploads to remove)")


def main() -> None:
    parser = argparse.ArgumentParser(description="PARC static site refactor pipeline")
    parser.add_argument("--dry-run", action="store_true", help="Preview without writing files")
    parser.add_argument(
        "--site-base",
        default=os.environ.get("PARC_SITE_BASE", config.SITE_BASE_PATH),
        help='Prefix for root-absolute URLs (default: /paresearchcenter; use "" for site root)',
    )
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("inventory", help="Phase 1: scan site/ and report stats")

    p_partials = sub.add_parser("extract-partials", help="Phase 2: extract shared partials")
    p_partials.add_argument(
        "--reference",
        default="site/about-us/index.html",
        help="Reference HTML page (default: site/about-us/index.html)",
    )

    p_content = sub.add_parser("extract-content", help="Phase 3a: extract page content")
    p_content.add_argument("--page", help="Single page, e.g. about-us/index.html")
    p_content.add_argument("--all", action="store_true", dest="extract_all", help="Extract all pages")

    p_render = sub.add_parser("render-page", help="Phase 3b: render one page to dist/")
    p_render.add_argument("--page", required=True, help="Page to render, e.g. about-us/index.html")

    p_render_all = sub.add_parser("render-all", help="Phase 3b: render all extracted pages to dist/")
    p_render_all.add_argument(
        "--no-assets",
        action="store_true",
        help="Skip copying wp-content/ and wp-includes/ into dist/",
    )

    sub.add_parser("sync-assets", help="Copy static assets from site/ into dist/")
    sub.add_parser("build", help="Render all pages and sync assets (full dist/)")

    p_prune = sub.add_parser("prune", help="Clean partials, rebuild HTML, delete dead assets")
    p_prune.add_argument("--uploads", action="store_true", help="Also remove unreferenced upload files")
    p_prune.add_argument("--skip-partials", action="store_true", help="Skip cleaning src/partials/")
    p_prune.add_argument("--skip-rebuild", action="store_true", help="Skip rebuilding HTML before pruning")

    sub.add_parser("analyze-refs", help="Show referenced vs unreferenced assets in dist/")

    args = parser.parse_args()
    if args.dry_run:
        config.DRY_RUN = True
    if getattr(args, "site_base", None) is not None:
        config.SITE_BASE_PATH = config._normalize_base_path(args.site_base)

    commands = {
        "inventory": cmd_inventory,
        "extract-partials": cmd_extract_partials,
        "extract-content": cmd_extract_content,
        "render-page": cmd_render_page,
        "render-all": cmd_render_all,
        "sync-assets": cmd_sync_assets,
        "build": cmd_build,
        "prune": cmd_prune,
        "analyze-refs": cmd_analyze_refs,
    }

    if args.command == "extract-content" and not args.page and not args.extract_all:
        parser.error("extract-content requires --page or --all")

    commands[args.command](args)


if __name__ == "__main__":
    main()
