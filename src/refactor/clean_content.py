"""Strip dead markup from extracted page content JSON."""
from __future__ import annotations

import json
import re
from pathlib import Path

from . import config
from .config import CONTENT_DIR

_CONTENT_PATTERNS = [
    re.compile(r'<div class="mailmunch-forms-[^"]*"[^>]*>.*?</div>', re.DOTALL | re.IGNORECASE),
    re.compile(r"<div class=\"mailmunch-forms-[^\"]*\"[^>]*/>", re.IGNORECASE),
]


def clean_content_json(path: Path) -> list[str]:
    data = json.loads(path.read_text(encoding="utf-8"))
    changes: list[str] = []
    for field in ("container", "breadcrumbs"):
        text = data.get(field, "")
        if not text:
            continue
        original = text
        for pat in _CONTENT_PATTERNS:
            text = pat.sub("", text)
        if text != original:
            data[field] = text
            changes.append(field)
    if changes and not config.DRY_RUN:
        path.write_text(json.dumps(data, indent=2), encoding="utf-8")
    return changes


def clean_all_content(content_dir: Path = CONTENT_DIR) -> int:
    touched = 0
    for path in sorted(content_dir.glob("*.json")):
        if clean_content_json(path):
            touched += 1
    return touched
