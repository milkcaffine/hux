# hux

Static archive for [mindsoap.net](https://mindsoap.net/).

GitHub Pages on `main` deploys this repo. `CNAME` is `mindsoap.net`. `www` is intentionally not configured.

## Structure

- Year folders (`2024/`, `2025/`, `2026/`) hold individual post HTML files.
- `index.html`, `index2024.html`, `index2025.html` are year indexes with portfolio cards.
- Shared `header.html` / `footer.html` loaded via jQuery.
- Images in `images/`. Assets use root-relative paths.

## Add a post

1. Put images in `images/`.
2. Add `YYYY/YYYY-MM-DD.html`. Copy an existing post and keep asset URLs root-relative (`/css/...`, `/js/...`, `/images/...`).
3. Add a card on the matching year index (`index.html`, `index2024.html`, `index2025.html`). Optionally include a category badge (`photo`, `tech`, `writing`, etc.).

Internal links should stay root-relative (`/about.html`), not `milkcaffine.github.io`.
