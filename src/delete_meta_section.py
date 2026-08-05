#!/usr/bin/env python3
"""Remove the sidebar Meta widget (section#meta-2) from blog HTML files."""
import re
from pathlib import Path

ROOT = Path(r"d:\CURRENT\PARC\simply-static-1-1785957008")
BLOG = ROOT / "blog"
DRY_RUN = False  # set True to preview without writing files

META_2_SECTION = re.compile(
    r'<section id=["\']meta-2["\'][^>]*>.*?</section>\s*',
    re.DOTALL | re.IGNORECASE,
)


def clean_html(text: str) -> tuple[str, list[str]]:
    changes = []
    new, n = META_2_SECTION.subn("", text, count=1)
    if n:
        changes.append("removed section#meta-2")
    return new, changes


def main():
    files = sorted(BLOG.rglob("*.html"))
    modified = skipped = 0

    for path in files:
        original = path.read_text(encoding="utf-8")
        cleaned, changes = clean_html(original)
        if not changes:
            skipped += 1
            continue
        modified += 1
        print(f"{'[DRY RUN] ' if DRY_RUN else ''}{path.relative_to(ROOT)}: {', '.join(changes)}")
        if not DRY_RUN:
            path.write_text(cleaned, encoding="utf-8")

    print(f"\nDone: {modified} modified, {skipped} unchanged, {len(files)} total")


if __name__ == "__main__":
    main()
