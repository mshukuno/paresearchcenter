# Physical Activity Research Center

This repository holds the **static** Physical Activity Research Center website, built for **GitHub Pages** from the `docs/` folder on `main`.

This project prepares the public site content on GitHub Pages ahead of a planned move from the current hosted environment. The **paresearchcenter.org** domain is intended to use this deployment when that transition happens—this repo is the basis for that site, not a separate mirror of it.

**Prepared:** August 2026

## Static site notice

This deployment is **read-only HTML**, not WordPress. Pages, images, and downloads from the export are kept so visitors can still browse the site after migration. Features that depended on WordPress or the previous host **are not available**:

- **News and blog updates** — no new posts after export; existing articles remain as published.
- **User registration and login** — accounts, admin login, and the dashboard are removed.
- **Content management** — no admin interface to create or edit pages, posts, or media.
- **RSS and comment feeds** — feed endpoints from the WordPress era are not maintained.
- **Interactive / server-side features** — forms, plugins, and backend services that required WordPress or hosting infrastructure no longer run.

Layout and links are preserved where possible so the site stays usable as the public face of PARC on GitHub Pages.

## Search

Search uses a **client-side index** built from the static HTML pages. It replaces WordPress search in a simplified form and **results may differ** from what the WordPress site showed in ranking, wording, and which pages appear. Results are shown on the `/search/` page.

## Development

Site updates are built on branch **`refactor/cleaningup-code`** (source export, build scripts, and maintenance tools). That branch publishes static files into **`docs/`** on **`main`**.

Build steps: render HTML from templates, remove unused plugins and MonsterInsights tracking, install client-side search, then copy **`dist/`** → **`docs/`**.
