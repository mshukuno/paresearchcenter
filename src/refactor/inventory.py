"""Phase 1: inventory the WordPress static export."""
from __future__ import annotations

import json
from dataclasses import asdict, dataclass
from pathlib import Path

from .config import REPO_ROOT, SITE_SRC


@dataclass
class FileStat:
    path: str
    lines: int
    bytes: int


@dataclass
class InventoryReport:
    html_pages: int
    total_files: int
    html_total_lines: int
    html_avg_lines: int
    largest_html: list[FileStat]
    top_level_dirs: dict[str, int]
    wp_includes_files: int
    wp_content_files: int
    content_html_files: list[str]


def _count_lines(path: Path) -> int:
    try:
        return path.read_text(encoding="utf-8", errors="replace").count("\n") + 1
    except OSError:
        return 0


def _is_content_html(path: Path) -> bool:
    """HTML pages outside wp-admin and other WP internals."""
    rel = path.relative_to(SITE_SRC).as_posix()
    skip_prefixes = ("wp-includes/", "wp-admin/", "wp-content/plugins/")
    return not any(rel.startswith(p) for p in skip_prefixes)


def run_inventory() -> InventoryReport:
    html_files: list[Path] = []
    all_files: list[Path] = []
    dir_counts: dict[str, int] = {}
    wp_includes = 0
    wp_content = 0

    for path in SITE_SRC.rglob("*"):
        if not path.is_file():
            continue
        all_files.append(path)
        rel = path.relative_to(SITE_SRC).as_posix()
        top = rel.split("/")[0] if "/" in rel else rel
        dir_counts[top] = dir_counts.get(top, 0) + 1

        if rel.startswith("wp-includes/"):
            wp_includes += 1
        elif rel.startswith("wp-content/"):
            wp_content += 1

        if path.suffix.lower() == ".html" and _is_content_html(path):
            html_files.append(path)

    html_stats: list[FileStat] = []
    total_lines = 0
    for path in sorted(html_files):
        text = path.read_text(encoding="utf-8", errors="replace")
        lines = text.count("\n") + 1
        total_lines += lines
        html_stats.append(
            FileStat(
                path=path.relative_to(SITE_SRC).as_posix(),
                lines=lines,
                bytes=len(text.encode("utf-8")),
            )
        )

    html_stats.sort(key=lambda s: s.lines, reverse=True)
    page_count = len(html_files)

    return InventoryReport(
        html_pages=page_count,
        total_files=len(all_files),
        html_total_lines=total_lines,
        html_avg_lines=total_lines // page_count if page_count else 0,
        largest_html=html_stats[:10],
        top_level_dirs=dict(sorted(dir_counts.items(), key=lambda kv: kv[1], reverse=True)),
        wp_includes_files=wp_includes,
        wp_content_files=wp_content,
        content_html_files=sorted(p.relative_to(SITE_SRC).as_posix() for p in html_files),
    )


def print_report(report: InventoryReport) -> None:
    print("=== Phase 1: Site Inventory ===\n")
    print(f"Content HTML pages:     {report.html_pages}")
    print(f"Total files in site/:   {report.total_files}")
    print(f"HTML total lines:        {report.html_total_lines:,}")
    print(f"HTML avg lines/page:     {report.html_avg_lines:,}")
    print(f"wp-includes/ files:      {report.wp_includes_files:,}")
    print(f"wp-content/ files:       {report.wp_content_files:,}")

    print("\nTop-level directories (file counts):")
    for name, count in list(report.top_level_dirs.items())[:12]:
        print(f"  {name:30} {count:>6,}")

    print("\nLargest HTML pages (lines):")
    for stat in report.largest_html:
        print(f"  {stat.lines:>5}  {stat.path}")

    est_shared = report.html_avg_lines * 0.6  # rough: ~60% duplicated chrome
    est_unique = report.html_avg_lines - est_shared
    print(
        f"\nRough duplication estimate: ~{est_shared:,.0f} shared lines/page "
        f"(head, nav, footer, scripts)"
    )
    print(f"Unique content estimate:    ~{est_unique:,.0f} lines/page")


def save_report(report: InventoryReport, out_path: Path | None = None) -> Path:
    out_path = out_path or REPO_ROOT / "src" / "inventory.json"
    out_path.write_text(json.dumps(asdict(report), indent=2), encoding="utf-8")
    return out_path
