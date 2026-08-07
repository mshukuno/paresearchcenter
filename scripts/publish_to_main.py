#!/usr/bin/env python3
"""Build dist/, light cleanup, and publish the static site to main as docs/ only."""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _paths import DEV_BRANCH, DOCS_DIR, MAIN_BRANCH, REPO_ROOT, SITE_OUT

STASH_MESSAGE = "publish-to-main-auto"
MAIN_README_PATH = REPO_ROOT / "README.main.md"


def load_main_readme() -> str:
    if not MAIN_README_PATH.is_file():
        raise GitError(f"Missing {MAIN_README_PATH}")
    return MAIN_README_PATH.read_text(encoding="utf-8")


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


class GitError(RuntimeError):
    pass


def run(cmd: list[str], *, check: bool = True) -> subprocess.CompletedProcess[str]:
    print("+", " ".join(cmd))
    result = subprocess.run(cmd, cwd=REPO_ROOT, text=True, capture_output=True)
    if result.stdout:
        print(result.stdout.rstrip())
    if result.stderr:
        print(result.stderr.rstrip(), file=sys.stderr)
    if check and result.returncode != 0:
        raise GitError(
            f"Command failed ({result.returncode}): {' '.join(cmd)}\n"
            f"{result.stderr or result.stdout or '(no output)'}"
        )
    return result


def current_branch() -> str:
    return run(["git", "branch", "--show-current"]).stdout.strip()


def worktree_dirty() -> bool:
    return bool(run(["git", "status", "--porcelain"]).stdout.strip())


def stash_if_dirty() -> bool:
    if not worktree_dirty():
        return False
    print("Stashing local changes before branch switch…")
    run(["git", "stash", "push", "-u", "-m", STASH_MESSAGE])
    return True


def pop_stash_if_any() -> None:
    listed = run(["git", "stash", "list"], check=False).stdout
    if STASH_MESSAGE not in listed:
        return
    if current_branch() != DEV_BRANCH:
        print(
            f"Warning: not on {DEV_BRANCH}; leaving stash in place. "
            f"Run `git checkout {DEV_BRANCH}` then `git stash pop`.",
            file=sys.stderr,
        )
        return
    print("Restoring stashed local changes…")
    result = run(["git", "stash", "pop"], check=False)
    if result.returncode != 0:
        print(
            "Warning: could not restore stash automatically. Run `git stash list` and `git stash pop`.",
            file=sys.stderr,
        )


def checkout_branch(name: str) -> None:
    run(["git", "checkout", name])


def build_site(*, skip_build: bool, skip_cleanup: bool) -> None:
    if not skip_build:
        run([sys.executable, "src/refactor.py", "build", "--site-base", "/paresearchcenter"])
    if not skip_cleanup:
        run([sys.executable, "scripts/cleanup_dist.py"])
    run([sys.executable, "scripts/patch_search_page.py"])
    run([sys.executable, "scripts/rebuild_search_index.py"])
    run([sys.executable, "scripts/install_site_search_js.py"])
    run([sys.executable, "scripts/build_archive_pages.py"])


def copy_tree(src: Path, dst: Path) -> None:
    if dst.exists():
        shutil.rmtree(dst, ignore_errors=True)
    if dst.exists():
        # Windows file locks can block rmtree; remove tracked files via git first.
        run(["git", "rm", "-rf", "--ignore-unmatch", "docs"], check=False)
        if dst.exists():
            shutil.rmtree(dst, ignore_errors=True)
    shutil.copytree(src, dst)


def update_main_tree(staging: Path, *, message: str, push: bool, readme_text: str) -> None:
    copy_tree(staging, DOCS_DIR)
    (REPO_ROOT / "README.md").write_text(readme_text, encoding="utf-8")

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


def clean_main_layout(*, push: bool, message: str) -> None:
    """One-time (or occasional) cleanup: main keeps docs/ + README only."""
    branch = current_branch()
    if branch != DEV_BRANCH:
        raise SystemExit(f"Run from {DEV_BRANCH} (current: {branch})")

    stashed = stash_if_dirty()
    readme_text = load_main_readme()
    try:
        run(["git", "fetch", "origin"])
        checkout_branch(MAIN_BRANCH)
        try:
            (REPO_ROOT / "README.md").write_text(readme_text, encoding="utf-8")
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
            checkout_branch(DEV_BRANCH)
    finally:
        if stashed:
            pop_stash_if_any()


def update_main_readme(*, message: str, push: bool) -> None:
    branch = current_branch()
    if branch != DEV_BRANCH:
        raise SystemExit(f"Run from {DEV_BRANCH} (current: {branch})")

    stashed = stash_if_dirty()
    readme_text = load_main_readme()
    try:
        run(["git", "fetch", "origin"])
        checkout_branch(MAIN_BRANCH)
        try:
            (REPO_ROOT / "README.md").write_text(readme_text, encoding="utf-8")
            run(["git", "add", "README.md"])
            status = run(["git", "status", "--porcelain"]).stdout.strip()
            if not status:
                print("main README is already up to date.")
                return
            run(["git", "commit", "-m", message])
            if push:
                run(["git", "push", "origin", MAIN_BRANCH])
        finally:
            checkout_branch(DEV_BRANCH)
    finally:
        if stashed:
            pop_stash_if_any()


def publish(
    *,
    message: str,
    push: bool,
    skip_build: bool,
    skip_cleanup: bool,
) -> None:
    branch = current_branch()
    if branch != DEV_BRANCH:
        raise SystemExit(f"Run from {DEV_BRANCH} (current: {branch})")

    if skip_build and not SITE_OUT.is_dir():
        raise SystemExit(f"Missing build output: {SITE_OUT}")

    build_site(skip_build=skip_build, skip_cleanup=skip_cleanup)

    readme_text = load_main_readme()

    with tempfile.TemporaryDirectory(prefix="parc-publish-") as tmp:
        staging = Path(tmp) / "dist"
        copy_tree(SITE_OUT, staging)
        (staging / ".nojekyll").touch(exist_ok=True)

        stashed = stash_if_dirty()
        on_dev_branch = False
        try:
            run(["git", "fetch", "origin"])
            checkout_branch(MAIN_BRANCH)
            try:
                update_main_tree(staging, message=message, push=push, readme_text=readme_text)
            finally:
                checkout_branch(DEV_BRANCH)
                on_dev_branch = True
        finally:
            if stashed and on_dev_branch:
                pop_stash_if_any()
            elif stashed:
                print(
                    f"Warning: publish interrupted before returning to {DEV_BRANCH}. "
                    "Stash kept — finish checkout, then run `git stash pop`.",
                    file=sys.stderr,
                )


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
        help="Reuse existing dist/ (still runs cleanup + search unless --skip-cleanup)",
    )
    parser.add_argument(
        "--skip-cleanup",
        action="store_true",
        help="Skip plugin/MonsterInsights cleanup",
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
    parser.add_argument(
        "--readme-only",
        action="store_true",
        help="Update README.md on main from README.main.md only",
    )
    args = parser.parse_args()

    try:
        if args.readme_only:
            update_main_readme(
                push=args.push,
                message=args.message or "Update main branch README",
            )
            return

        if args.clean_main_only:
            clean_main_layout(
                push=args.push,
                message=args.message or "Make main branch docs-only for GitHub Pages",
            )
            return

        if args.build_only:
            build_site(skip_build=args.skip_build, skip_cleanup=args.skip_cleanup)
            return

        publish(
            message=args.message,
            push=args.push,
            skip_build=args.skip_build,
            skip_cleanup=args.skip_cleanup,
        )
    except GitError as exc:
        raise SystemExit(str(exc)) from exc


if __name__ == "__main__":
    main()
