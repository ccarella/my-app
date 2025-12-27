# Repository Guidelines

## Project Structure & Module Organization
- `src/` holds React source code (`main.jsx` bootstraps the app, `App.jsx` is the root component, `index.css`/`App.css` contain styles).
- `src/assets/` stores bundled assets used by components.
- `public/` is for static files served as-is (referenced by absolute paths like `/favicon.svg`).
- `index.html` is the Vite entry HTML file.
- `vite.config.js` and `eslint.config.js` contain build and lint configuration.

## Build, Test, and Development Commands
Use `pnpm` (see `pnpm-lock.yaml`).
- `pnpm install` installs dependencies.
- `pnpm dev` runs the Vite dev server with HMR at a local URL.
- `pnpm build` creates a production build in `dist/`.
- `pnpm preview` serves the production build locally for verification.
- `pnpm lint` runs ESLint on the project.

## Coding Style & Naming Conventions
- Indentation: 2 spaces; no semicolons (match existing `src/*.jsx`).
- React components use PascalCase (e.g., `App`), hooks use `useX` names.
- Files are lowercase with `.jsx` for React components.
- Linting: ESLint with `eslint-plugin-react-hooks` and `eslint-plugin-react-refresh`; keep code lint-clean.

## Testing Guidelines
- No automated test framework is configured yet. If you add tests, document the runner and add a `pnpm test` script.
- Prefer colocating test files near source (e.g., `src/Foo.test.jsx`) once a framework is added.

## Commit & Pull Request Guidelines
- Git history is minimal, so no strict commit convention is established. Use short, imperative summaries (e.g., "Add header layout").
- PRs should include: a concise description, links to related issues (if any), and screenshots for UI changes.
- Note any manual verification steps (e.g., `pnpm dev`, `pnpm build`).

## Configuration Tips
- Vite supports environment variables via `.env` files; use `VITE_` prefixes for client-exposed values.
- Keep secrets out of `public/` and client code.
