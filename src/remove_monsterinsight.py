#!/usr/bin/env python3
"""Remove MonsterInsights from all HTML files in a Simply Static export."""
import re
from pathlib import Path

ROOT = Path(r"d:\CURRENT\PARC\simply-static-1-1785957008")
DRY_RUN = False  # set False to actually write files

# Chunk 1: comment-delimited block (non-greedy, dotall)
MI_BLOCK = re.compile(
    r"\s*<!-- This site uses the Google Analytics by MonsterInsights.*?<!-- / Google Analytics by MonsterInsights -->\s*",
    re.DOTALL | re.IGNORECASE,
)

# Chunk 2: external + inline MonsterInsights scripts
MI_SCRIPTS = re.compile(
    r'<script[^>]*id=["\']monsterinsights-frontend-script-js["\'][^>]*></script>\s*'
    r'<script[^>]*id=["\']monsterinsights-frontend-script-js-extra["\'][^>]*>.*?</script>\s*',
    re.DOTALL | re.IGNORECASE,
)

def clean_html(text: str) -> tuple[str, list[str]]:
    changes = []
    new, n1 = MI_BLOCK.subn("", text, count=1)
    if n1:
        changes.append("removed MI comment block")
    new, n2 = MI_SCRIPTS.subn("", new, count=1)
    if n2:
        changes.append("removed MI script tags")
    return new, changes

def main():
    files = list(ROOT.rglob("*.html"))
    modified = skipped = 0

    for path in sorted(files):
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