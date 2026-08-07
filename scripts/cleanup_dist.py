#!/usr/bin/env python3
"""Light dist/ cleanup: strip MonsterInsights and remove unused plugin folders."""
from __future__ import annotations

import re
import shutil
import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "src"))
from _paths import SITE_OUT
from refactor.refs import collect_references

# Admin, export, tracking, and security plugins — safe to drop on static hosting.
FORCE_REMOVE_PLUGINS = frozenset(
    {
        "google-analytics-for-wordpress",
        "better-wp-security",
        "change-admin-email-setting-without-outbound-email",
        "force-regenerate-thumbnails",
        "simply-static",
        "velvet-blues-update-urls",
        "wp-display-header",
        "wpconsent-cookies-banner-privacy-suite",
    }
)

MI_BLOCK = re.compile(
    r"\s*<!-- This site uses the Google Analytics by MonsterInsights.*?<!-- / Google Analytics by MonsterInsights -->\s*",
    re.DOTALL | re.IGNORECASE,
)
MI_SCRIPTS = re.compile(
    r'<script[^>]*id=["\']monsterinsights-frontend-script-js["\'][^>]*></script>\s*'
    r'<script[^>]*id=["\']monsterinsights-frontend-script-js-extra["\'][^>]*>.*?</script>\s*',
    re.DOTALL | re.IGNORECASE,
)


def strip_monsterinsights(root: Path) -> int:
    changed = 0
    for path in root.rglob("*.html"):
        text = path.read_text(encoding="utf-8", errors="replace")
        new, n1 = MI_BLOCK.subn("", text, count=1)
        new, n2 = MI_SCRIPTS.subn("", new, count=1)
        if n1 or n2:
            path.write_text(new, encoding="utf-8")
            changed += 1
    return changed


def remove_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path)


def cleanup(root: Path = SITE_OUT) -> None:
    if not root.is_dir():
        raise SystemExit(f"Site output not found: {root}")

    mi_files = strip_monsterinsights(root)
    if mi_files:
        print(f"Stripped MonsterInsights from {mi_files} HTML files")

    refs = collect_references(root)
    plugins_dir = root / "wp-content/plugins"
    removed: list[str] = []
    if plugins_dir.is_dir():
        for plugin_dir in sorted(plugins_dir.iterdir()):
            if not plugin_dir.is_dir():
                continue
            name = plugin_dir.name
            if name in FORCE_REMOVE_PLUGINS or name not in refs.plugins:
                remove_dir(plugin_dir)
                removed.append(name)

    remove_dir(root / "wp-content/mu-plugins")

    if removed:
        print(f"Removed {len(removed)} plugin folders: {', '.join(removed)}")
    else:
        print("No unused plugin folders to remove")


def main() -> None:
    cleanup()


if __name__ == "__main__":
    main()
