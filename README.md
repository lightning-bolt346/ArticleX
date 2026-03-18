# ArticleX

Convert X/Twitter posts into clean, exportable documents (HTML, Markdown, DOCX, PDF, PNG).

## Project structure

- `articlex/` - React + TypeScript + Vite SPA
- `vercel.json` - root-level Vercel config for this monorepo layout

## Local setup

```bash
cd articlex
npm ci
npm run dev
```

## Deploy to Vercel (recommended)

This repository already includes a root `vercel.json`, so you can import the repo and deploy without extra build-path setup.

### Steps

1. Push your code to GitHub.
2. In Vercel: **Add New Project** and import this repo.
3. Keep project root as repository root (default).
4. Add environment variables from `articlex/.env.example` as needed.
5. Deploy.

Vercel will run:

- Install: `cd articlex && npm ci`
- Build: `cd articlex && npm run build`
- Output: `articlex/dist`

## Optional integrations

The frontend is pre-wired for optional configuration:

- Auth/backends: Supabase, Firebase, Clerk
- Payments: Stripe and Razorpay
- Optional backend payment verification endpoints for Stripe/Razorpay

See `articlex/.env.example` and `articlex/README.md` for variable details.
