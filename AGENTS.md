# Repository Guidelines

## Project Structure & Module Organization

This is a small marketplace demo built as a single Next.js 16 (App Router) + TypeScript app at the repository root.

- `app/` — `layout.tsx` (metadata, global CSS), `page.tsx` (reads `?screen=`/`?modal=` and renders the client app), `globals.css` (Tailwind v4 + shared visual rules), and `api/**/route.ts` route handlers that replace the former Express API.
- `components/` — client components. `StoreApp.tsx` (`'use client'`) owns navigation, cart, and payment state; the other files are screens and modals (PascalCase, e.g. `CartDrawer.tsx`).
- `lib/` — server-side logic and shared types: `dataset.ts` (CSV loading and risk enrichment, cached on `globalThis`), `deals.ts` (offer scoring and better-deal rules), `userStore.ts` (in-memory demo user and balance), and `types.ts` (shared by API and UI).
- `data/` — `store_listings_3000.csv` plus the model outputs `risk-scores.json`, `risk-model.json`, and `risk_model.joblib`. Keep the CSV column names compatible with `lib/dataset.ts`. Every store listing must have an entry in `risk-scores.json`, or loading the dataset fails.
- Python ML tooling: `generate_seller_dataset.py` (synthetic data), `train_risk_model.py` + `new_model/seller_risk_model.py` (HistGradientBoosting risk model; writes into `data/`).

## Build, Test, and Development Commands

- `npm run dev` — starts the Next.js dev server (UI and API) on port 3000.
- `npm run build` — production build into `.next/`.
- `npm run start` — serves the production build (long-running Node server; the in-memory balance resets on restart).
- `npm run lint` — runs Oxlint and `tsc --noEmit`.

There is currently no automated test command. For changes, run lint and build, then manually exercise the affected UI/API flow with `npm run dev`.

## Coding Style & Naming Conventions

TypeScript in strict mode, two-space indentation, double quotes, semicolons, and trailing commas in multiline expressions. Use PascalCase component filenames and exports and camelCase for functions, props, and local variables. Type component props with an interface and reuse the types in `lib/types.ts` for API data. Keep components focused on a screen or interaction.

In route handlers, convert CSV-derived numeric values explicitly before calculations, and keep endpoint response shapes stable because the UI depends on them. Oxlint enforces React Hooks rules and warns about non-component exports.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects such as `Add frontend with a working equation based backend`. Use the same approach: start with a verb, describe one cohesive change, and avoid vague messages such as `updates`.

Pull requests should explain the user-visible or API behavior changed, note dataset/schema changes, and link relevant issues when available. Include screenshots or a brief recording for UI changes, plus the commands you ran (`lint`, `build`, and manual checks). Do not commit generated directories such as `node_modules/` or `.next/`, or local environment secrets.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
