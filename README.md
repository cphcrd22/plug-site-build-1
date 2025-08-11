# Plug Type Finder — Exact-Match MVP (Sample Data)

Deterministic, **exact-match** lookup that returns **plug types, voltage, and frequency** for a destination **only when the normalized query matches a curated alias**. No LLM, no fuzzy. Optimized for edge latency.

## What’s inside

- **/api/lookup** — Edge resolver (NFKD normalize → strip diacritics → lowercase → remove punctuation except spaces/hyphens → collapse spaces → trim → exact match in `aliases.json` → join `plug-types.json`)
- **/api/suggest** — Optional **prefix-only** suggestions from alias keys (still exact tokens)
- **Sample data** — Tiny `aliases.json` + `plug-types.json` (countries only) to validate the pipeline
- **UI** — Minimal search + result card with animations and P3 Pro CTA

## Run locally (Cursor or terminal)

1. **Create project folder** and open in Cursor:
   - In Cursor, `File → Add Folder to Workspace…` and select your empty folder.
   - Create files exactly as in `PROJECT_STRUCTURE.md` (or paste from ChatGPT output).

2. **Env (optional)**:
   - Copy `.env.local.example` → `.env.local`
   - Adjust `DATASET_VERSION` if you want.

3. **Install deps**:
   ```bash
   npm install
