# Site maintenance

This repo publishes the live site from **`main`**, folder **`/dist`**, via GitHub Pages. Day-to-day development happens on **`refactor/cleaningup-code`**; `main` should stay a deploy branch with `README.md` and `dist/` only.

## Yearly task (start of each year)

The footer copyright year is set at **build time** (see `src/partials/footer.html`). Rebuild once at the beginning of each year so pages show the current year (for example, `©2018–2027`).

### 1. Rebuild on the development branch

From the repo root, on **`refactor/cleaningup-code`**:

```powershell
pip install -r requirements.txt
python src/refactor.py build
```

Optional but recommended after `build` (removes assets that are no longer referenced):

```powershell
python src/refactor.py prune
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

### 3. Update `main` with the new `dist/`

Copy only the rebuilt `dist/` folder to `main`. Keep `README.md` on `main`.

```powershell
git fetch origin
git checkout -B main origin/main
git checkout refactor/cleaningup-code -- dist/
git status
git commit -m "Update dist/ for new copyright year."
git push origin main
git checkout refactor/cleaningup-code
```

### 4. Verify GitHub Pages

In the repo **Settings → Pages**:

- **Source branch:** `main`
- **Folder:** `/dist`

After the push, allow a minute or two for Pages to redeploy, then check the live site footer.

## When to run maintenance outside the yearly schedule

Run `build` (and update `main` as above) whenever you change:

- `src/partials/` (header, footer, shared scripts)
- `src/content/` (page body content)
- `src/templates/page.html`

See [REFACTOR.md](REFACTOR.md) for the full pipeline and command reference.
