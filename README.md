# paresearchcenter

Static site for [Physical Activity Research Center](https://ncsu-cga-sc.github.io/paresearchcenter/), published on GitHub Pages.

## Branches

| Branch | Purpose |
|--------|---------|
| **`main`** | GitHub Pages — **`docs/`** and **`README.md`** only |
| **`refactor/cleaningup-code`** | Development — `site/`, `src/`, `scripts/`, `dist/` |

## Quick start

On **`refactor/cleaningup-code`**:

```powershell
pip install -r requirements.txt
python scripts/publish_to_main.py --build-only
```

Preview (matches GitHub Pages URLs):

```powershell
python scripts/preview_server.py
```

Open http://localhost:8000/paresearchcenter/

Do **not** use `cd dist && python -m http.server` — HTML assets use the `/paresearchcenter/` prefix and will 404 without the preview script.

## Publish to GitHub Pages

```powershell
python scripts/publish_to_main.py -m "Update site" --push
```

This runs **build → light cleanup → search assets → copy to `docs/` on `main`**.

Light cleanup removes unused WordPress plugin folders, GoDaddy `mu-plugins`, and MonsterInsights tracking snippets. It does **not** delete uploads or trim `wp-includes/`.

See [MAINTENANCE.md](MAINTENANCE.md) for GitHub Pages settings and yearly copyright updates.
