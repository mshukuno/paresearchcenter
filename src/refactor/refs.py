"""Collect asset path references from rendered HTML."""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path

ASSET_PAT = re.compile(r'(?:/wp-content/[^\s"\'<>]+|/wp-includes/[^\s"\'<>]+)')
SOURCE_URL_PAT = re.compile(r"sourceURL=([^\s*/][^\s*]+)")

# Invalid plugin names from prefetch patterns like /wp-content/*
_INVALID_PLUGINS = frozenset({"*"})


@dataclass
class ReferenceReport:
    root: Path
    asset_urls: set[str] = field(default_factory=set)
    plugins: set[str] = field(default_factory=set)
    themes: set[str] = field(default_factory=set)
    includes_urls: set[str] = field(default_factory=set)
    upload_paths: set[str] = field(default_factory=set)

    @property
    def include_files(self) -> set[Path]:
        out: set[Path] = set()
        for url in self.includes_urls:
            rel = url.lstrip("/")
            if rel.startswith("wp-includes/"):
                out.add(self.root / rel)
        return out


def collect_references(root: Path) -> ReferenceReport:
    report = ReferenceReport(root=root)
    for html in root.rglob("*.html"):
        text = html.read_text(encoding="utf-8", errors="replace")
        for match in ASSET_PAT.findall(text):
            url = match.split("?")[0]
            report.asset_urls.add(url)
            if url.startswith("/wp-content/plugins/"):
                parts = url.split("/")
                if len(parts) > 3:
                    report.plugins.add(parts[3])
            elif url.startswith("/wp-content/themes/"):
                parts = url.split("/")
                if len(parts) > 3:
                    report.themes.add(parts[3])
            elif url.startswith("/wp-includes/"):
                report.includes_urls.add(url)
            elif "/wp-content/uploads/" in url:
                report.upload_paths.add(url.split("/wp-content/uploads/", 1)[1])

    report.plugins -= _INVALID_PLUGINS
    return report


def dir_size(path: Path) -> tuple[int, float]:
    if not path.exists():
        return 0, 0.0
    files = [f for f in path.rglob("*") if f.is_file()]
    mb = sum(f.stat().st_size for f in files) / 1024 / 1024
    return len(files), mb


def tree_size(root: Path) -> tuple[int, float]:
    if not root.exists():
        return 0, 0.0
    files = [f for f in root.rglob("*") if f.is_file()]
    return len(files), sum(f.stat().st_size for f in files) / 1024 / 1024
