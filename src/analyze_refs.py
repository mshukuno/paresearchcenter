#!/usr/bin/env python3
"""Analyze which wp-content/wp-includes paths are referenced by dist HTML."""
from __future__ import annotations

from pathlib import Path

from refactor.refs import collect_references, dir_size

DIST = Path(__file__).resolve().parents[1] / "dist"


def main() -> None:
    report = collect_references(DIST)
    all_plugins = sorted(p.name for p in (DIST / "wp-content/plugins").iterdir() if p.is_dir())
    unused_plugins = [p for p in all_plugins if p not in report.plugins]

    print("=== Referenced in HTML ===")
    print("Plugins:", ", ".join(sorted(report.plugins)) or "(none)")
    print("Themes:", ", ".join(sorted(report.themes)) or "(none)")
    print(f"wp-includes URLs: {len(report.includes_urls)}")
    print(f"upload files: {len(report.upload_paths)}")

    print("\n=== Unreferenced plugins ===")
    total_unused_mb = 0.0
    for p in unused_plugins:
        n, mb = dir_size(DIST / "wp-content/plugins" / p)
        total_unused_mb += mb
        print(f"  {p:50} {n:5} files  {mb:6.1f} MB")
    print(f"  TOTAL{'':45} {total_unused_mb:6.1f} MB")

    print("\n=== wp-includes URLs ===")
    for r in sorted(report.includes_urls):
        print(f"  {r}")
    n, mb = dir_size(DIST / "wp-includes")
    print(f"  TOTAL tree: {n} files, {mb:.1f} MB")

    upload_root = DIST / "wp-content/uploads"
    all_uploads = {f.relative_to(upload_root).as_posix() for f in upload_root.rglob("*") if f.is_file()}
    orphan = all_uploads - report.upload_paths
    orphan_bytes = sum((upload_root / p).stat().st_size for p in orphan)
    print(f"\n=== Uploads ===")
    print(f"  On disk: {len(all_uploads)} files")
    print(f"  Referenced: {len(report.upload_paths)} files")
    print(f"  Orphan: {len(orphan)} files, {orphan_bytes / 1024 / 1024:.1f} MB")


if __name__ == "__main__":
    main()
