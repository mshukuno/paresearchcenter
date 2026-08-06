#!/usr/bin/env python3
"""Build dist/ and publish the static site to main as docs/ only."""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import DEV_BRANCH, DOCS_DIR, MAIN_BRANCH, REPO_ROOT, SITE_OUT

MAIN_README = """# Physical Activity Research Center

Static site published to GitHub Pages from this branch.

- **Live site:** https://mshukuno.github.io/paresearchcenter/
- **Source / build pipeline:** branch `refactor/cleaningup-code`

This branch intentionally contains only `docs/` and this README. Edit the site on the development branch, then publish:

```powershell
git checkout refactor/cleaningup-code
python scripts/publish_to_main.py --push
```
"""

# Paths removed from main when publishing (development-only).
DEV_ONLY_PATHS = (
    "dist",
    "site",
    "scripts",
    "src",
    "requirements.txt",
    "REFACTOR.md",
    "MAINTENANCE.md",
    ".gitignore",
)


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(cmd))
    return subprocess.run(cmd, cwd=REPO_ROOT, check=check, text=True, capture_output=True)


def current_branch() -> str:
    return run(["git", "branch", "--show-current"]).stdout.strip()


def build_site(*, skip_build: bool) -> None:
    if not skip_build:
        run([sys.executable, "src/refactor.py", "build", "--site-base", "/paresearchcenter"])
    run([sys.executable, "scripts/rebuild_search_index.py"])
    run([sys.executable, "scripts/install_site_search_js.py"])


def copy_tree(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst)
    shutil.copytree(src, dst)


def clean_main_layout(*, push: bool, message: str) -> None:
    """One-time (or occasional) cleanup: main keeps docs/ + README only."""
    run(["git", "fetch", "origin"])
    run(["git", "checkout", MAIN_BRANCH])
    try:
        (REPO_ROOT / "README.md").write_text(MAIN_README, encoding="utf-8")
        run(["git", "add", "README.md"])
        for rel in DEV_ONLY_PATHS:
            run(["git", "rm", "-rf", "--ignore-unmatch", rel])
        status = run(["git", "status", "--porcelain"]).stdout.strip()
        if not status:
            print("main is already docs-only.")
            return
        run(["git", "commit", "-m", message])
        if push:
            run(["git", "push", "origin", MAIN_BRANCH])
    finally:
        run(["git", "checkout", DEV_BRANCH])


def publish(*, message: str, push: bool, skip_build: bool) -> None:
    branch = current_branch()
    if branch != DEV_BRANCH:
        raise SystemExit(f"Run from {DEV_BRANCH} (current: {branch})")

    if skip_build:
        if not SITE_OUT.is_dir():
            raise SystemExit(f"Missing build output: {SITE_OUT}")
    else:
        build_site(skip_build=False)

    with tempfile.TemporaryDirectory(prefix="parc-publish-") as tmp:
        staging = Path(tmp) / "dist"
        copy_tree(SITE_OUT, staging)
        (staging / ".nojekyll").touch(exist_ok=True)

        run(["git", "fetch", "origin"])
        run(["git", "checkout", MAIN_BRANCH])

        try:
            copy_tree(staging, DOCS_DIR)
            (REPO_ROOT / "README.md").write_text(MAIN_README, encoding="utf-8")

            run(["git", "add", "docs", "README.md"])
            for rel in DEV_ONLY_PATHS:
                run(["git", "rm", "-rf", "--ignore-unmatch", rel])

            status = run(["git", "status", "--porcelain"]).stdout.strip()
            if not status:
                print("Nothing to publish — docs/ already matches dist/.")
                return

            run(["git", "commit", "-m", message])
            if push:
                run(["git", "push", "origin", MAIN_BRANCH])
        finally:
            run(["git", "checkout", DEV_BRANCH])


def main() -> None:
    parser = argparse.ArgumentParser(description="Publish dist/ to main branch as docs/.")
    parser.add_argument(
        "-m",
        "--message",
        default="Update docs/ from refactor build",
        help="Commit message on main",
    )
    parser.add_argument("--push", action="store_true", help="Push main to origin after commit")
    parser.add_argument(
        "--skip-build",
        action="store_true",
        help="Reuse existing dist/ (still runs search index + script install)",
    )
    parser.add_argument(
        "--build-only",
        action="store_true",
        help="Build dist/ and search assets only; do not touch main",
    )
    parser.add_argument(
        "--clean-main-only",
        action="store_true",
        help="Remove development files from main; keep existing docs/",
    )
    args = parser.parse_args()

    if args.clean_main_only:
        clean_main_layout(
            push=args.push,
            message=args.message or "Make main branch docs-only for GitHub Pages",
        )
        return

    if args.build_only:
        build_site(skip_build=args.skip_build)
        return

    publish(message=args.message, push=args.push, skip_build=args.skip_build)


if __name__ == "__main__":
    main()
