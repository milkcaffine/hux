# hux

Static archive for [mindsoap.net](https://mindsoap.net/).

GitHub Pages on `main` deploys this repo. `CNAME` is `mindsoap.net`. `www` is intentionally not configured.

## Structure

- Year folders (`2024/`, `2025/`, `2026/`) hold individual post HTML files named `YYYY-MM-DD.html` (same-day extras: `YYYY-MM-DD-2nd.html`).
- `index.html` (current year), `index2024.html`, `index2025.html` are year indexes with portfolio cards.
- Shared `header.html` / `footer.html` load into `#headers` / `#footers` via `/js/site.js` (vanilla `fetch`, no jQuery). It also handles the mobile nav toggle and the active year in the footer.
- Images in `images/`. Assets use root-relative paths.

## Add a post

1. Put images in `images/` (prefer `YYYY-MM-DD.jpg`, `YYYY-MM-DD-01.jpg`, …).
2. Add `YYYY/YYYY-MM-DD.html`. Copy a recent post in that year folder; keep asset URLs root-relative (`/css/...`, `/js/...`, `/images/...`).
3. Keep the shared chrome: `#headers` / `#footers` placeholders and `<script src="/js/site.js" defer></script>` in `<head>`. Set a real `<title>`, `description`, and the Open Graph tags (`og:title`, `og:description`, `og:url`, `og:image` with absolute `https://mindsoap.net/...` URLs). Give every `<img>` an `alt`.
4. Add a card on the matching year index (`index.html` for the current year, or `index2024.html` / `index2025.html`). Optionally include a category badge (`photo`, `tech`, `writing`, etc.).

Internal links should stay root-relative (`/about.html`), not `milkcaffine.github.io`.

## Preview locally

Do not open HTML files via Finder (`file://`) — `/css`, `/js`, `/images`, and header/footer loads will break. From the repo root:

```bash
python3 -m http.server 8765
```

Then open `http://127.0.0.1:8765/`.
