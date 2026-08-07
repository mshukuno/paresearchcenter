# Site maintenance

This repo publishes the live site from **`main`**, folder **`/docs`**, via GitHub Pages. Day-to-day development happens on **`refactor/cleaningup-code`**; `main` should stay a deploy branch with `README.md` and `docs/` only.

The pipeline still builds into **`dist/`** on the development branch. Copy `dist/` → `docs/` on `main` when deploying.

## GitHub Pages setup (first time)

The site is **already built** in `dist/`. GitHub should **not** run Jekyll or any Node.js build. The build pipeline writes an empty `.nojekyll` file (copied into `docs/` on deploy).

In the repo **Settings → Pages → Build and deployment**:

- **Source:** Deploy from a branch
- **Branch:** `main`
- **Folder:** `/docs`

Click **Save**. After 1–3 minutes, the Pages settings page should show:

> Your site is live at `https://<user>.github.io/paresearchcenter/`

GitHub Pages only supports **`/ (root)`** or **`/docs`** as publish folders — not `/dist`. Using **`/docs`** keeps the repo root clean while matching what Pages expects.

No GitHub Actions workflow is needed. Nothing is built on GitHub.

**Asset paths:** HTML uses root-absolute paths like `/wp-content/...`. On a GitHub **project** site (`https://<user>.github.io/<repo>/`), those must include the repo name. The build defaults to `--site-base /paresearchcenter`. The folder name `docs` does **not** appear in URLs — only the repo name does.

For local preview from `dist/`, rebuild with an empty base:

```powershell
python src/refactor.py build --site-base ""
```

For a **custom domain** at the site root, also use `--site-base ""`.

If Pages fails with a Jekyll or Node.js build error, confirm the source is **Deploy from a branch** (not GitHub Actions) and that `docs/.nojekyll` exists on `main`. Disable any auto-added Jekyll workflow under **Actions**.

## Yearly task (start of each year)

The footer copyright year is set at **build time** (see `src/partials/footer.html`). Rebuild once at the beginning of each year so pages show the current year (for example, `©2018–2027`).

### 1. Rebuild on the development branch

From the repo root, on **`refactor/cleaningup-code`**:

```powershell
pip install -r requirements.txt
python scripts/publish_to_main.py --build-only
```

Preview locally if you want to spot-check:

```powershell
cd dist
python -m http.server 8000
```

Open http://localhost:8000 and confirm the footer shows the updated year.

### 2. Commit and push the development branch

```powershell
cd ..
git checkout refactor/cleaningup-code
git add dist/
git commit -m "Rebuild dist for new copyright year."
git push origin refactor/cleaningup-code
```

### 3. Update `main` with the new `docs/`

From **`refactor/cleaningup-code`**, use the publish script (replaces the manual copy steps below):

```powershell
python scripts/publish_to_main.py -m "Update docs/ for new copyright year." --push
```

<details>
<summary>Manual copy (legacy)</summary>

Copy the rebuilt `dist/` contents into `docs/` on `main`. Keep `README.md` at the repo root.

```powershell
git fetch origin
git checkout -B main origin/main
git rm -rf docs
git checkout refactor/cleaningup-code -- dist/
New-Item -ItemType Directory -Force -Path docs | Out-Null
Get-ChildItem -Path dist -Force | ForEach-Object { Move-Item -LiteralPath $_.FullName -Destination docs/ -Force }
Remove-Item -Recurse -Force dist
git add -A
git status
git commit -m "Update docs/ for new copyright year."
git push origin main
git checkout refactor/cleaningup-code
```

</details>

### 4. Verify GitHub Pages

See [GitHub Pages setup (first time)](#github-pages-setup-first-time) above.

After the push, allow a minute or two for Pages to redeploy, then check the live site footer.

## When to run maintenance outside the yearly schedule

Run `build` (and update `main` as above) whenever you change:

- `src/partials/` (header, footer, shared scripts)
- `src/content/` (page body content)
- `src/templates/page.html`

See [REFACTOR.md](REFACTOR.md) for the full pipeline and command reference.
