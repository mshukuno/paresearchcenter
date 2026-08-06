"""Remove dead WordPress / hosting scripts from shared partials."""
from __future__ import annotations

import re
from pathlib import Path

from . import config
from .config import PARTIALS_DIR

# Patterns applied repeatedly until no matches (handles concatenated minified HTML).
_PATTERNS: list[tuple[str, str]] = [
    ("speculationrules", r"<script type=\"speculationrules\">.*?</script>"),
    ("wpsolr nonce", r"<input id=\"wpsolr_autocomplete_nonce\"[^>]*/>"),
    ("wpsolr scripts", r"<script[^>]*(wpsolr|solr_auto|autocomplete-js|urljs-js|loadingoverlay)[^>]*>.*?</script>"),
    ("wpsolr css", r"<link[^>]*wpsolr[^>]*/>"),
    ("godaddy css", r"<link[^>]*godaddy-launch[^>]*/>"),
    ("ml-slider admin css", r"<link[^>]*ml-slider/admin[^>]*/>"),
    ("mailmunch", r"<script[^>]*(?:mailmunch|_mmunch)[^>]*>.*?</script>"),
    ("wp emoji css", r"<style id=\"wp-emoji-styles-inline-css\"[^>]*>.*?</style>"),
    ("wp emoji settings", r"<script id=\"wp-emoji-settings\"[^>]*>.*?</script>"),
    ("wp emoji loader", r"<script type=\"module\">.*?wp-emoji-loader.*?</script>"),
    ("comment-reply", r"<script[^>]*comment-reply[^>]*>.*?</script>"),
    ("godaddy traffic", r"<script>.*?_trfd.*?</script>"),
    ("godaddy click tracker", r"<script>window\.addEventListener\('click'.*?</script>"),
    ("godaddy tti", r"<script[^>]*tccl-tti[^>]*></script>"),
    ("godaddy form honeypot", r"<script type=\"text/javascript\">\s*jQuery\(function \(\$\) \{.*?</script>"),
    ("extract artifact", r"^site-wrapper\s*"),
]


def _clean_text(text: str) -> tuple[str, list[str]]:
    changes: list[str] = []
    for label, pattern in _PATTERNS:
        flags = re.DOTALL | (re.MULTILINE if label == "extract artifact" else 0)
        while True:
            new, n = re.subn(pattern, "", text, count=1, flags=flags)
            if not n:
                break
            if label not in changes:
                changes.append(label)
            text = new
    return text.strip() + "\n", changes


def clean_partials(partials_dir: Path = PARTIALS_DIR) -> dict[str, list[str]]:
    results: dict[str, list[str]] = {}
    for name in ("head-assets.html", "body-scripts.html"):
        path = partials_dir / name
        if not path.exists():
            continue
        cleaned, changes = _clean_text(path.read_text(encoding="utf-8"))
        if changes and not config.DRY_RUN:
            path.write_text(cleaned, encoding="utf-8")
        results[name] = changes
    return results
