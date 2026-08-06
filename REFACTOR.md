# Static site refactor & cleaning

This repo hosts the PARC website as a **static export** from WordPress (GoDaddy / Simply Static). The refactor pipeline turns the bloated export into a smaller, maintainable site for GitHub Pages.

## Folders

| Path | Role |
|------|------|
| `site/` | **Source export** — original WordPress static dump (~335 MB). Used as input; not deployed. |
| `dist/` | **Deploy output** — rebuilt HTML + pruned assets (~200 MB). **This is what GitHub Pages serves.** |
| `src/partials/` | Shared header, footer, head assets, scripts (edit once, rebuild all pages). |
| `src/content/` | Per-page extracted content (title, breadcrumbs, main body) as JSON. |
| `src/templates/` | Jinja2 layout (`page.html`). |

```
site/  ──extract──►  src/content/ + src/partials/
                         │
                         ▼ render + sync-assets
                      dist/  ──prune──►  smaller dist/
```

## Prerequisites

```powershell
pip install -r requirements.txt
```

Requires Python 3.10+ and packages: `beautifulsoup4`, `Jinja2`.

## Quick start (full rebuild)

From the repo root:

```powershell
# 1. One-time setup (if src/content/ or src/partials/ are missing)
python src/refactor.py extract-partials
python src/refactor.py extract-content --all

# 2. Build deploy folder
python src/refactor.py build

# 3. Clean dead WordPress / hosting cruft
python src/refactor.py prune

# 4. Preview locally
cd dist
python -m http.server 8000
```

Open http://localhost:8000

## GitHub Pages

- Publish from branch **`refactor/cleaningup-code`** (or `main` after merge).
- Set **Pages source folder** to **`/dist`**.

After changing content or partials, rebuild and commit:

```powershell
python src/refactor.py build
python src/refactor.py prune
git add dist/ src/
git commit -m "Rebuild dist after site changes"
git push
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

Update the `ROOT` path inside each script if re-running against a new export. Prefer `prune` for ongoing maintenance.

---

## Size reference

| Stage | Files | Size (approx.) |
|-------|-------|----------------|
| `site/` (raw export) | ~6,400 | ~335 MB |
| `dist/` after `build` | ~6,400 | ~335 MB |
| `dist/` after `prune` | ~1,900 | ~200 MB |
| `dist/` after `prune --uploads` | ~1,200 | ~125 MB |

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
