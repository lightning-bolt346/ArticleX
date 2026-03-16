# AGENTS.md

## Cursor Cloud specific instructions

### Project overview

ArticleX is a client-side React SPA (in `articlex/`) that converts X/Twitter post URLs into exportable documents (HTML, Markdown, DOCX). No backend, no database, no Docker — purely browser-based.

### Development commands

All commands run from the `articlex/` directory:

| Task | Command |
|------|---------|
| Install deps | `npm ci` |
| Dev server | `npm run dev` (Vite on `http://localhost:5173/articlex/`) |
| Lint | `npm run lint` |
| Build | `npm run build` (runs `tsc -b && vite build`) |
| Preview prod build | `npm run preview` |

### Notes and caveats

- The Vite config sets `base: '/articlex/'`, so the dev server URL path is `/articlex/`, not `/`.
- There is no test framework configured (no Jest, Vitest, Playwright). Manual browser testing is the primary validation method.
- `npm run lint` currently reports 2 pre-existing `react-hooks/set-state-in-effect` errors in `App.tsx` and `CustomCursor.tsx`. These are in the existing codebase and not regressions.
- No `.env` files or secrets are required. The app is entirely client-side with no API keys.
- For manual testing, use the `computerUse` subagent to open `http://localhost:5173/articlex/` in Chrome, paste an X URL (e.g. `https://x.com/elonmusk/status/1234567890`), and click Convert.
