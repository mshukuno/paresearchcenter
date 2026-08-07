#!/usr/bin/env python3
"""Local preview with /paresearchcenter paths (same as GitHub Pages)."""
from __future__ import annotations

import http.server
import socketserver
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import SITE_OUT

SITE_BASE = "/paresearchcenter"
PORT = 8000


class PreviewHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, request, client_address, server):
        super().__init__(request, client_address, server, directory=str(SITE_OUT))

    def translate_path(self, path: str) -> str:
        clean = path.split("?", 1)[0].split("#", 1)[0]
        if clean == SITE_BASE or clean == f"{SITE_BASE}/":
            clean = "/"
        elif clean.startswith(f"{SITE_BASE}/"):
            clean = clean[len(SITE_BASE) :]
        return super().translate_path(clean)

    def log_message(self, format: str, *args) -> None:
        if args and isinstance(args[0], str) and args[0].startswith("GET /.well-known/"):
            return
        super().log_message(format, *args)


def main() -> None:
    if not SITE_OUT.is_dir():
        raise SystemExit(f"Missing build output: {SITE_OUT}. Run publish --build-only first.")

    url = f"http://localhost:{PORT}{SITE_BASE}/"
    with socketserver.TCPServer(("", PORT), PreviewHandler) as httpd:
        print(f"Serving {SITE_OUT}")
        print(f"Open {url}")
        httpd.serve_forever()


if __name__ == "__main__":
    main()
