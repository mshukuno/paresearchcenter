"""Shared paths and settings for the site refactor pipeline."""
import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SITE_SRC = REPO_ROOT / "site"
SITE_OUT = REPO_ROOT / "dist"
TEMPLATES_DIR = REPO_ROOT / "src" / "templates"
PARTIALS_DIR = REPO_ROOT / "src" / "partials"
CONTENT_DIR = REPO_ROOT / "src" / "content"


def _normalize_base_path(raw: str) -> str:
    raw = raw.strip()
    if not raw or raw == "/":
        return ""
    if not raw.startswith("/"):
        raw = "/" + raw
    return raw.rstrip("/")


# GitHub project pages live at https://<user>.github.io/<repo>/ — prefix root paths.
# Set PARC_SITE_BASE="" for a custom domain at the site root or local preview from dist/.
SITE_BASE_PATH = _normalize_base_path(os.environ.get("PARC_SITE_BASE", "/paresearchcenter"))

# Reference page used to seed shared header/footer/head partials.
REFERENCE_PAGE = SITE_SRC / "about-us" / "index.html"

DRY_RUN = False
