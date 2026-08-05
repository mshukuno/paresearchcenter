#!/usr/bin/env python3
"""Clear the Stay Connected footer widget (section#cc_mm_widget-3) while keeping the column shell."""
import re
from pathlib import Path

ROOT = Path(r"d:\CURRENT\PARC\simply-static-1-1785957008")
DRY_RUN = False  # set True to preview without writing files

STAY_CONNECTED_SECTION = re.compile(
    r'(<section id=["\']cc_mm_widget-3["\'][^>]*><div class="footer-widget-inside">).*?(</div></section>)',
    re.DOTALL | re.IGNORECASE,
)


def clean_html(text: str) -> tuple[str, list[str]]:
    changes = []
    new, n = STAY_CONNECTED_SECTION.subn(r"\1\2", text, count=1)
    if n:
        changes.append("cleared section#cc_mm_widget-3")
    return new, changes


def main():
    files = sorted(ROOT.rglob("*.html"))
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
