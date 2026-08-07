# Static site refactor

PARC website as a **static export** from WordPress (Simply Static), rebuilt for GitHub Pages.

## Folders

| Path | Role |
|------|------|
| `site/` | Original WordPress static export (input only) |
| `dist/` | Build output — copied to `docs/` on `main` for GitHub Pages |
| `src/partials/` | Shared header, footer, head assets |
| `src/content/` | Per-page content as JSON |
| `src/templates/` | Jinja2 layout |

## Quick start

```powershell
pip install -r requirements.txt
python scripts/publish_to_main.py --build-only   # build + cleanup + search → dist/
cd dist && python -m http.server 8000
```

## Publish

```powershell
python scripts/publish_to_main.py -m "Update site" --push
```

## Cleanup (automatic on publish)

`scripts/cleanup_dist.py` runs after each build:

- Strips MonsterInsights (Google Analytics) snippets from HTML
- Removes unused plugin folders (security, export, cookie consent, etc.)
- Removes `wp-content/mu-plugins/` (GoDaddy hosting)

Does **not** remove uploads or bulk-trim `wp-includes/`. For aggressive size reduction, `python src/refactor.py prune` is available on the dev branch but is not part of the default publish path.

## Commands

```powershell
python src/refactor.py build --site-base /paresearchcenter
python src/refactor.py render-all --no-assets
python scripts/cleanup_dist.py
python src/refactor.py analyze-refs    # audit referenced plugins/assets
python src/refactor.py prune           # optional; not used by default publish
```

---

## Commands

All commands run from the repo root:

```powershell
python src/refactor.py <command> [options]
```

Add `--dry-run` before the command to preview without writing files (safe for `prune`).

| Command | Description |
|---------|-------------|
| `inventory` | Scan `site/` — page counts, duplication estimate. Writes `src/inventory.json`. |
| `extract-partials` | Pull shared chrome from a reference page into `src/partials/`. |
| `extract-content --all` | Extract all 81 pages into `src/content/*.json`. |
| `extract-content --page about-us/index.html` | Extract one page. |
| `render-page --page about-us/index.html` | Render one page to `dist/`. |
| `render-all` | Render all pages (use `--no-assets` to skip copying CSS/JS/images). |
| `sync-assets` | Copy `wp-content/` and `wp-includes/` from `site/` into `dist/`. |
| **`build`** | **`render-all` + `sync-assets`** — full deploy folder. |
| **`prune`** | Clean partials, rebuild HTML, delete unused plugins/assets. |
| `analyze-refs` | Report which plugins/uploads in `dist/` are actually referenced. |

### Prune options

```powershell
python src/refactor.py prune                  # default: clean + rebuild + delete
python src/refactor.py prune --dry-run        # preview deletions only
python src/refactor.py prune --uploads        # also remove unreferenced media (~75 MB)
python src/refactor.py prune --skip-partials  # delete files only, don't edit partials
python src/refactor.py prune --skip-rebuild   # don't regenerate HTML first
```

---

## What `prune` removes

### From `src/partials/` (then HTML is rebuilt)

- WPSolr search (broken on static hosting)
- GoDaddy traffic / form scripts
- MailMunch
- WordPress emoji loader
- Comment-reply script
- TrustedSite badge (remove manually in partials if re-extracted)

### From `src/content/` (page bodies)

- Hidden MailMunch placeholder divs

### From `dist/` (deleted on disk)

- **Unused plugin folders** — MonsterInsights, security plugins, cookie consent, PDF embedder, ml-slider, WPSolr, etc.
- **`wp-content/mu-plugins/`** — GoDaddy hosting code
- **Most of `wp-includes/`** — keeps only jQuery, masonry, imagesloaded, etc. (~8 files vs ~1,400)
- **`--uploads`** — images/PDFs in `wp-content/uploads/` not linked from any HTML

### Kept in `dist/`

- All 81 HTML pages (rebuilt from templates)
- Theme CSS/JS (`septera`, `septera-child`)
- Slider plugin (`cryout-serious-slider`)
- CoBlocks animation assets (used on homepage)
- Referenced uploads (images, PDFs, GIFs)

---

## Typical workflows

### Edit site-wide header or footer

1. Edit `src/partials/header.html`, `footer.html`, or `colophon.html`.
2. Run `python src/refactor.py render-all --no-assets` (HTML only, faster).
3. Or `python src/refactor.py build` if assets may have changed.

### Edit one page's content

1. Edit the JSON in `src/content/` **or** re-extract from `site/` after editing the export:
   ```powershell
   python src/refactor.py extract-content --page about-us/index.html
   ```
2. `python src/refactor.py render-page --page about-us/index.html`

### Re-import a fresh WordPress export

1. Replace `site/` with the new Simply Static export.
2. Run the legacy cleanup scripts if needed (see below).
3. Re-run from **Quick start**: `extract-partials`, `extract-content --all`, `build`, `prune`.

### Audit before deleting more

```powershell
python src/refactor.py analyze-refs
python src/analyze_refs.py          # same analysis, standalone script
```

---

## Legacy one-off scripts

These were used on the original export before the template pipeline existed:

| Script | Purpose |
|--------|---------|
| `src/remove_monsterinsight.py` | Strip MonsterInsights tracking |
| `src/delete_meta_section.py` | Remove sidebar Meta widget |
| `src/remove_stayconnected_widget.py` | Clear Stay Connected footer widget |

Update the `ROOT` path inside legacy scripts if re-running against a new export. Day-to-day cleanup uses `scripts/cleanup_dist.py`.

---

## Troubleshooting

**404s for CSS/JS when serving `dist/`**  
Run `python src/refactor.py sync-assets` or `build` — HTML alone is not enough; assets must be copied from `site/`.

**Console errors from TrustedSite / GoDaddy / MailMunch**  
Run `python src/refactor.py prune` to strip them from partials and rebuild.

**`extract-content` requires `--page` or `--all`**  
Use `--all` for every page, or `--page path/to/index.html` for one.

**Changes to partials not showing**  
Run `render-all` or `build` — editing partials does not update `dist/` until you rebuild.
