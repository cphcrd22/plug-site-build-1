# Plug Type Finder — Exact-Match MVP

.
├─ app/
│  ├─ api/
│  │  ├─ lookup/
│  │  │  └─ route.ts           # Edge exact-match resolver (deterministic)
│  │  └─ suggest/
│  │     └─ route.ts           # Optional prefix-only suggestions (exact tokens)
│  ├─ globals.css              # Tailwind base styles
│  ├─ layout.tsx               # App shell
│  └─ page.tsx                 # Main page (Search + ResultCard)
├─ components/
│  ├─ ResultCard.tsx           # Result card with plug types, voltage, Hz, CTA
│  ├─ SearchBar.tsx            # Search input + suggestions + animations
│  └─ icons.tsx                # Small icon set (Spinner, Check, ArrowRight, Bolt, Wave)
├─ data/
│  └─ merged.json              # Country plug specs dataset
├─ lib/
│  ├─ flags.ts                 # Country code → flag emoji
│  ├─ norm.ts                  # Deterministic normalization (NFKD, strip diacritics, etc.)
│  └─ types.ts                 # Shared TypeScript types
├─ public/
│  └─ favicon.ico
├─ .env.local.example          # DATASET_VERSION sample
├─ next.config.mjs
├─ package.json
├─ postcss.config.js
├─ tailwind.config.ts
├─ tsconfig.json
└─ README.md                   # How to run + PID summary
