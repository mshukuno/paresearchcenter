# paresearchcenter

Static site refactor and build pipeline for [Physical Activity Research Center](https://mshukuno.github.io/paresearchcenter/).

## Branches

| Branch | Purpose |
|--------|---------|
| **`main`** | GitHub Pages deploy — **`docs/` only** |
| **`refactor/cleaningup-code`** | Development — `src/`, `scripts/`, `site/`, `dist/` |

## Quick start (development branch)

```powershell
pip install -r requirements.txt
python src/refactor.py build --site-base /paresearchcenter
python scripts/rebuild_search_index.py
python scripts/install_site_search_js.py
```

Preview:

```powershell
cd dist
python -m http.server 8000
```

## Publish to GitHub Pages

From **`refactor/cleaningup-code`**:

```powershell
# Full rebuild + copy dist/ → main/docs/ + commit
python scripts/publish_to_main.py -m "Update site" --push
```

One-time cleanup if `main` still has `scripts/` or `src/` (keeps existing `docs/`):

```powershell
python scripts/publish_to_main.py --clean-main-only --push
```

See [MAINTENANCE.md](MAINTENANCE.md) and [REFACTOR.md](REFACTOR.md) for details.
