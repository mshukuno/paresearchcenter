"""Shared paths and settings for the site refactor pipeline."""
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
SITE_SRC = REPO_ROOT / "site"
SITE_OUT = REPO_ROOT / "dist"
TEMPLATES_DIR = REPO_ROOT / "src" / "templates"
PARTIALS_DIR = REPO_ROOT / "src" / "partials"
CONTENT_DIR = REPO_ROOT / "src" / "content"

# Reference page used to seed shared header/footer/head partials.
REFERENCE_PAGE = SITE_SRC / "about-us" / "index.html"

DRY_RUN = False
