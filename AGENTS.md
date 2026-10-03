# Repository Guidelines

## Project Structure & Module Organization

This is a small marketplace demo with separate frontend and API projects. The React 19/Vite client lives in `client/`: `src/main.jsx` boots the app, `src/App.jsx` owns the primary view, `src/components/` contains screen and modal components, and `src/assets/` holds bundled images. Shared visual rules are in `src/index.css` and `src/App.css`.

The Express API is in `server/server.js`. It loads and enriches marketplace listings from the root-level `fake_marketplace_dataset_full_features.csv`; keep the CSV column names compatible with the API's parsing logic. `generate_seller_dataset.py` regenerates sample data. `scripts/dev.sh` starts both applications.

## Build, Test, and Development Commands

- `npm run dev` — starts the API and Vite development server together from the repository root.
- `npm run start --prefix server` — runs the Express API (default port `4000`).
- `npm run dev --prefix client` — runs the frontend development server.
- `npm run build --prefix client` — creates the production frontend in `client/dist/`.
- `npm run lint --prefix client` — runs Oxlint against client code.

There is currently no automated test command. For changes, lint the client, build it, and manually exercise the affected UI/API flow while both services are running.

## Coding Style & Naming Conventions

Follow the surrounding file style: client JSX uses two-space indentation, single quotes, semicolons omitted, and trailing commas in multiline expressions. Use PascalCase component filenames and exports (for example, `CartDrawer.jsx`); use camelCase for functions, props, and local variables. Keep components focused on a screen or interaction.

Server JavaScript follows two-space indentation, double quotes, semicolons, and trailing commas. Keep endpoint/data-transformation helpers near their usage and convert CSV-derived numeric values explicitly before calculations. Run Oxlint after editing client code; it enforces React Hooks rules and warns about non-component exports.

## Commit & Pull Request Guidelines

Recent commits use short imperative subjects such as `Add frontend with a working equation based backend`. Use the same approach: start with a verb, describe one cohesive change, and avoid vague messages such as `updates`.

Pull requests should explain the user-visible or API behavior changed, note dataset/schema changes, and link relevant issues when available. Include screenshots or a brief recording for UI changes, plus the commands you ran (`lint`, `build`, and manual checks). Do not commit generated dependency directories such as `node_modules/` or local environment secrets.
