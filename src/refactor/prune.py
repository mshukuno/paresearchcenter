"""Phase 4: prune unreferenced assets from dist/."""
from __future__ import annotations

import shutil
from dataclasses import dataclass, field
from pathlib import Path

from .clean_content import clean_all_content
from .clean_partials import clean_partials
from . import config
from .config import CONTENT_DIR, PARTIALS_DIR, SITE_OUT
from .refs import collect_references, dir_size, tree_size


@dataclass
class PruneReport:
    partials_cleaned: dict[str, list[str]] = field(default_factory=dict)
    plugins_removed: list[str] = field(default_factory=list)
    dirs_removed: list[str] = field(default_factory=list)
    includes_removed: int = 0
    uploads_removed: int = 0
    bytes_freed: int = 0

    def add_freed(self, path: Path) -> None:
        if path.exists():
            if path.is_file():
                self.bytes_freed += path.stat().st_size
            else:
                self.bytes_freed += sum(
                    f.stat().st_size for f in path.rglob("*") if f.is_file()
                )


def _rm_tree(path: Path, report: PruneReport) -> None:
    if not path.exists():
        return
    report.add_freed(path)
    label = path.relative_to(path.anchor) if path.is_absolute() else str(path)
    if config.DRY_RUN:
        n, mb = dir_size(path)
        print(f"[DRY RUN] Would delete {path} ({n} files, {mb:.1f} MB)")
        return
    shutil.rmtree(path)
    report.dirs_removed.append(str(path))


def _rm_file(path: Path, report: PruneReport) -> None:
    if not path.is_file():
        return
    report.add_freed(path)
    if config.DRY_RUN:
        print(f"[DRY RUN] Would delete {path}")
        return
    path.unlink()


def prune_unreferenced_plugins(root: Path, report: PruneReport) -> None:
    refs = collect_references(root)
    plugins_dir = root / "wp-content/plugins"
    if not plugins_dir.is_dir():
        return
    for plugin_dir in sorted(plugins_dir.iterdir()):
        if not plugin_dir.is_dir():
            continue
        if plugin_dir.name in refs.plugins:
            continue
        _rm_tree(plugin_dir, report)
        report.plugins_removed.append(plugin_dir.name)


def prune_mu_plugins(root: Path, report: PruneReport) -> None:
    mu = root / "wp-content/mu-plugins"
    if mu.exists():
        _rm_tree(mu, report)


def prune_wp_includes(root: Path, report: PruneReport) -> None:
    refs = collect_references(root)
    inc_root = root / "wp-includes"
    if not inc_root.is_dir():
        return

    keep: set[Path] = set()
    for url in refs.includes_urls:
        rel = url.lstrip("/")
        target = root / rel
        if target.is_file():
            keep.add(target.resolve())

    for path in sorted(inc_root.rglob("*"), reverse=True):
        if not path.is_file():
            continue
        if path.resolve() in keep:
            continue
        _rm_file(path, report)
        report.includes_removed += 1

    if not config.DRY_RUN:
        for path in sorted(inc_root.rglob("*"), reverse=True):
            if path.is_dir() and not any(path.iterdir()):
                path.rmdir()


def prune_orphan_uploads(root: Path, report: PruneReport) -> None:
    refs = collect_references(root)
    upload_root = root / "wp-content/uploads"
    if not upload_root.is_dir():
        return

    for path in sorted(upload_root.rglob("*"), reverse=True):
        if not path.is_file():
            continue
        rel = path.relative_to(upload_root).as_posix()
        if rel in refs.upload_paths:
            continue
        _rm_file(path, report)
        report.uploads_removed += 1

    if not config.DRY_RUN:
        for path in sorted(upload_root.rglob("*"), reverse=True):
            if path.is_dir() and not any(path.iterdir()):
                path.rmdir()


def run_prune(
    root: Path = SITE_OUT,
    *,
    clean: bool = True,
    rebuild: bool = True,
    uploads: bool = False,
) -> PruneReport:
    """Full prune pipeline: clean partials → rebuild HTML → delete dead assets."""
    report = PruneReport()

    if clean:
        report.partials_cleaned = clean_partials(PARTIALS_DIR)
        for name, changes in report.partials_cleaned.items():
            if changes:
                print(f"Cleaned {name}: {', '.join(changes)}")
        n = clean_all_content()
        if n:
            print(f"Cleaned mailmunch placeholders in {n} content files")

    if rebuild:
        if not CONTENT_DIR.exists() or not list(CONTENT_DIR.glob("*.json")):
            raise SystemExit("No extracted content. Run: python src/refactor.py extract-content --all")
        from .render import render_all

        render_all(root, sync_static=False)
        print(f"Rebuilt HTML in {root}/")

    prune_unreferenced_plugins(root, report)
    prune_mu_plugins(root, report)
    prune_wp_includes(root, report)

    if uploads:
        prune_orphan_uploads(root, report)

    return report


def print_prune_report(report: PruneReport, root: Path = SITE_OUT) -> None:
    n, mb = tree_size(root)
    print("\n=== Prune summary ===")
    if report.plugins_removed:
        print(f"Plugins removed ({len(report.plugins_removed)}): {', '.join(report.plugins_removed)}")
    if report.dirs_removed:
        print(f"Other dirs removed: {len(report.dirs_removed)}")
    print(f"wp-includes files removed: {report.includes_removed}")
    if report.uploads_removed:
        print(f"Orphan uploads removed: {report.uploads_removed}")
    print(f"Space freed: {report.bytes_freed / 1024 / 1024:.1f} MB")
    print(f"dist/ now: {n:,} files, {mb:.1f} MB")
