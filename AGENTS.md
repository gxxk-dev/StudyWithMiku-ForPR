# Repository Guidelines

## Project Structure & Module Organization
The Vite + Vue 3 frontend lives under `src/`: `components/`, `composables/` (hooks like `useMusic`), `services/`, and `utils/`. Static assets and the icon source stay in `public/`, which feeds `scripts/generate-icons.js`. Cloudflare Worker routing, middleware, and the Durable Object implementation sit in `workers/` with `wrangler.toml`. Production artifacts are written to `dist/`.

## Build, Test, and Development Commands
- `npm install` — install dependencies.
- `npm run dev` — start the Vite dev server on http://localhost:5173.
- `npm run generate-icons` — rebuild PWA icons from `public/icon-source.png`.
- `npm run build` — produce the optimized bundle and copy assets into `dist/`.
- `npm run preview` — serve the built bundle locally.
- `npm run dev:worker` — rebuild and run `wrangler dev --local` for the Hono worker and `OnlineCounter`.
- `npm run deploy:worker` — publish via Wrangler; ensure bindings and secrets are correct.

## Coding Style & Naming Conventions
Use ES modules with single quotes and two-space indentation. Components stay PascalCase (`PomodoroTimer.vue`) and export default; composables and utilities use camelCase file names. Keep `<script setup>` blocks lean, share helpers through `utils/`, and favor descriptive refs (`currentVideo`, `aplayerInitialized`). Base styles live in `src/style.css`; scope component styles only when needed.

## Testing Guidelines
There is no automated test suite yet, so rely on manual smoke tests for both the UI and worker endpoints. After code changes, run `npm run dev` and confirm video switching, Pomodoro flow, and the embedded APlayer. For worker updates, run `npm run dev:worker` and hit `/count` plus `/ws` to ensure the Durable Object increments correctly. When adding tests, use Vitest component specs under `src/__tests__` with descriptive names such as `pomodoro-timer.spec.js`.

## Commit & Pull Request Guidelines
Follow Conventional Commits (`feat: add pomodoro presets`, `fix(worker): guard ws cors`) and keep each change scoped. Use GitHub Flow: branch from `main`, push frequently, and open a PR once manual tests pass. PR descriptions should state the motivation, include test evidence (commands and screenshots for UI work), and link related issues or migrations that must run after merge.

## Deployment & Configuration Tips
`wrangler.toml` defines the `OnlineCounter` Durable Object and binds assets through the `ASSETS` namespace. Increment migration tags sequentially and keep prior tags intact. Before deploying, verify `wrangler whoami`, configure secrets outside git, and confirm `dist/` was freshly built because the worker serves those files for unknown routes.
