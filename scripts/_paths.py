"""Shared paths for maintenance scripts on the development branch."""
from __future__ import annotations

import os
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
SITE_OUT = Path(os.environ.get("PARC_SITE_OUT", REPO_ROOT / "dist"))
DOCS_DIR = REPO_ROOT / "docs"
MAIN_BRANCH = "main"
DEV_BRANCH = "refactor/cleaningup-code"
