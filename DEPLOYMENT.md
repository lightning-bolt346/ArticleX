# ArticleX — Deployment Guide

This guide covers deploying ArticleX to **Vercel** (primary) and **GitHub Pages** (secondary), and how to wire up optional integrations (Stripe, Razorpay, Supabase, Firebase, Clerk).

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Option A: Deploy to Vercel (Recommended)](#option-a-deploy-to-vercel-recommended)
- [Option B: Deploy to GitHub Pages](#option-b-deploy-to-github-pages)
- [Running Both Simultaneously](#running-both-simultaneously)
- [Adding Integrations](#adding-integrations)
  - [Razorpay (Payments / Tips)](#razorpay-payments--tips)
  - [Stripe (Payments)](#stripe-payments)
  - [Supabase (Auth + Database)](#supabase-auth--database)
  - [Firebase (Auth + Database)](#firebase-auth--database)
  - [Clerk (Auth)](#clerk-auth)
- [Environment Variables Reference](#environment-variables-reference)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

- **Node.js 20+** and **npm 10+**
- A **GitHub** account (repo already created)
- A **Vercel** account (free tier works) — sign up at [vercel.com](https://vercel.com)

---

## Option A: Deploy to Vercel (Recommended)

### Step 1: Push your code to GitHub

Make sure the latest code is pushed to your GitHub repository:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

### Step 2: Import project in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **"Import Git Repository"**
3. Select your GitHub account and find the **ArticleX** repository
4. Click **Import**

### Step 3: Configure the project

On the "Configure Project" screen, set these values:

| Setting | Value |
|---------|-------|
| **Framework Preset** | `Vite` (Vercel should auto-detect this) |
| **Root Directory** | `articlex` |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `dist` (default) |
| **Install Command** | `npm ci` (default) |

> **Important:** You MUST set **Root Directory** to `articlex` because the Vite app lives inside the `articlex/` subfolder, not the repository root.

### Step 4: Add environment variables (optional at this stage)

If you want payments, auth, or database features, add the relevant environment variables now. Otherwise, skip this — the app works without any env vars.

Click **"Environment Variables"** and add any you need:

| Variable | Where to get it |
|----------|-----------------|
| `VITE_RAZORPAY_KEY_ID` | Razorpay Dashboard → API Keys |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → API Keys |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → API Keys |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → API Keys |

See [Adding Integrations](#adding-integrations) below for the full list.

### Step 5: Deploy

Click **"Deploy"**. Vercel will:
1. Clone your repo
2. Navigate to `articlex/`
3. Run `npm ci` to install dependencies
4. Run `npm run build` (which runs `tsc -b && vite build`)
5. Deploy the `dist/` folder as a static site
6. Deploy any files in `api/` as serverless functions

Wait ~60 seconds. Your site will be live at:
```
https://your-project-name.vercel.app
```

### Step 6: Set up a custom domain (optional)

1. Go to your project in Vercel Dashboard
2. Click **Settings** → **Domains**
3. Add your custom domain (e.g., `articlex.yourdomain.com`)
4. Follow the DNS instructions Vercel provides:
   - **CNAME record**: `articlex` → `cname.vercel-dns.com`
   - Or **A record**: `@` → `76.76.21.21`
5. Vercel auto-provisions HTTPS via Let's Encrypt

### Step 7: Verify deployment

After deployment:
1. Visit your Vercel URL — you should see the ArticleX homepage
2. Test the health endpoint: `https://your-project.vercel.app/api/health`
3. Paste an X/Twitter URL and click Convert
4. Try exporting to different formats

### Automatic deployments

After the initial setup, every push to `main` will trigger a new deployment automatically. Vercel also creates **Preview Deployments** for every pull request, so you can test changes before merging.

---

## Option B: Deploy to GitHub Pages

GitHub Pages is already configured via `.github/workflows/deploy.yml`.

### Step 1: Enable GitHub Pages

1. Go to your repo on GitHub → **Settings** → **Pages**
2. Under "Build and deployment", set:
   - **Source**: `GitHub Actions`
3. That's it — the workflow handles the rest

### Step 2: Trigger a deployment

Push to `main` (or click "Run workflow" under Actions → "Deploy ArticleX to GitHub Pages"):

```bash
git push origin main
```

The workflow will:
1. Install dependencies
2. Build with `VITE_BASE_PATH=/<repo-name>/` (auto-detected from the repo)
3. Upload the `dist/` folder as a Pages artifact
4. Deploy to GitHub Pages

### Step 3: Access your site

Your site will be live at:
```
https://<your-username>.github.io/<repo-name>/
```

For example: `https://lightning-bolt346.github.io/ArticleX/`

### Limitations of GitHub Pages

- **No serverless functions** — the `api/` directory only works on Vercel
- **No server-side env vars** — payment verification endpoints won't work
- **Static only** — works great for the core conversion feature, but advanced integrations need Vercel

---

## Running Both Simultaneously

You can run **both** Vercel and GitHub Pages at the same time:

| Platform | URL | Base Path | API Routes | Best For |
|----------|-----|-----------|------------|----------|
| **Vercel** | `your-project.vercel.app` | `/` | Yes (`/api/*`) | Production with full features |
| **GitHub Pages** | `username.github.io/ArticleX/` | `/ArticleX/` | No | Free static hosting, demo |

How it works:
- **Vercel** auto-deploys on every push to `main` (and preview on PRs)
- **GitHub Pages** auto-deploys on every push to `main` via GitHub Actions
- The `VITE_BASE_PATH` is set to `/` for Vercel (default) and `/<repo-name>/` for GitHub Pages (via the workflow)
- The app uses `HashRouter`, so client-side routing works on both platforms without additional server config

---

## Adding Integrations

All integrations are **opt-in** via environment variables. If a variable is not set, that feature is simply disabled — the app never crashes.

### Razorpay (Payments / Tips)

Razorpay is used for the "Support ArticleX" tip button.

**1. Create a Razorpay account** at [razorpay.com](https://razorpay.com)

**2. Get your API keys:**
- Dashboard → Settings → API Keys → Generate Key
- You'll get a **Key ID** (public) and **Key Secret** (private)

**3. Add environment variables in Vercel:**

Go to Vercel Dashboard → Your Project → Settings → Environment Variables:

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_RAZORPAY_KEY_ID` | `rzp_live_xxxxxxxxxxxx` | Production, Preview |
| `RAZORPAY_KEY_SECRET` | `your_secret_key` | Production only |
| `VITE_RAZORPAY_VERIFY_ENDPOINT` | `/api/payments/verify` | Production, Preview |

**4. Redeploy** — Vercel will pick up the new env vars on the next deployment:
```bash
# Push any change, or trigger manually:
# Vercel Dashboard → Deployments → Redeploy
```

**5. Test it:**
- Open your site
- Convert any tweet
- Click "Support ArticleX"
- The Razorpay payment modal should appear

### Stripe (Payments)

**1. Create a Stripe account** at [stripe.com](https://stripe.com)

**2. Get your API keys:**
- Dashboard → Developers → API Keys
- Copy the **Publishable key** (starts with `pk_`) and **Secret key** (starts with `sk_`)

**3. Add environment variables in Vercel:**

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_STRIPE_PUBLISHABLE_KEY` | `pk_live_xxxxxxxxxxxx` | Production, Preview |
| `STRIPE_SECRET_KEY` | `sk_live_xxxxxxxxxxxx` | Production only |
| `VITE_STRIPE_VERIFY_ENDPOINT` | `/api/payments/verify` | Production, Preview |

**4. Redeploy and test.**

### Supabase (Auth + Database)

Supabase provides authentication, a PostgreSQL database, and edge functions.

**1. Create a Supabase project** at [supabase.com](https://supabase.com)

**2. Get your keys:**
- Project Settings → API
- Copy the **Project URL** and **anon (public) key**
- For server-side access, also copy the **service_role key**

**3. Add environment variables in Vercel:**

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_SUPABASE_URL` | `https://xxxx.supabase.co` | All |
| `VITE_SUPABASE_ANON_KEY` | `eyJ...` | All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` | Production only |

**4. Run the SQL bootstrap file.**

Open Supabase SQL Editor and run:

```sql
-- paste the contents of articlex/supabase-setup.sql
```

That file creates:
- `collections`
- `collection_items`
- `tweet_cache`
- `articles`
- RLS policies
- `increment_collection_views(...)`

**5. Redeploy.** The app detects Supabase availability via `integrationAvailability.supabase` in `src/lib/env.ts`.

### Firebase (Auth + Database)

**1. Create a Firebase project** at [console.firebase.google.com](https://console.firebase.google.com)

**2. Add a web app** and copy the config values.

**3. Add environment variables in Vercel:**

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_FIREBASE_API_KEY` | Your API key | All |
| `VITE_FIREBASE_AUTH_DOMAIN` | `project.firebaseapp.com` | All |
| `VITE_FIREBASE_PROJECT_ID` | Your project ID | All |
| `VITE_FIREBASE_STORAGE_BUCKET` | `project.appspot.com` | All |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sender ID | All |
| `VITE_FIREBASE_APP_ID` | App ID | All |

### Clerk (Auth)

**1. Create a Clerk application** at [clerk.com](https://clerk.com)

**2. Get your keys** from the Clerk Dashboard → API Keys.

**3. Add environment variables in Vercel:**

| Variable | Value | Environments |
|----------|-------|--------------|
| `VITE_CLERK_PUBLISHABLE_KEY` | `pk_live_xxxxxxxxxxxx` | All |
| `CLERK_SECRET_KEY` | `sk_live_xxxxxxxxxxxx` | Production only |

---

## Environment Variables Reference

### Frontend (exposed to browser — `VITE_` prefix)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_BASE_PATH` | URL base path (`/` for Vercel, `/<repo>/` for GH Pages) | No (defaults to `/`) |
| `VITE_API_BASE_URL` | Base URL for API endpoints | No |
| `VITE_RAZORPAY_KEY_ID` | Razorpay public key | No |
| `VITE_RAZORPAY_VERIFY_ENDPOINT` | Payment verification endpoint | No |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe public key | No |
| `VITE_STRIPE_VERIFY_ENDPOINT` | Payment verification endpoint | No |
| `VITE_CLERK_PUBLISHABLE_KEY` | Clerk public key | No |
| `VITE_SUPABASE_URL` | Supabase project URL | No |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | No |
| `VITE_FIREBASE_API_KEY` | Firebase API key | No |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain | No |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | No |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase storage bucket | No |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender ID | No |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | No |

### Backend (server-only — Vercel API routes)

| Variable | Description | Required |
|----------|-------------|----------|
| `RAZORPAY_KEY_SECRET` | Razorpay secret for signature verification | For Razorpay |
| `STRIPE_SECRET_KEY` | Stripe secret for API calls | For Stripe |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | For server-side Supabase |
| `CLERK_SECRET_KEY` | Clerk secret for backend auth | For server-side Clerk |

---

## Local Development

### Basic setup (no integrations)

```bash
cd articlex
npm ci
npm run dev
```

Open `http://localhost:5173/` — the app works fully without any env vars.

### With integrations

```bash
cd articlex
cp .env.example .env
```

Edit `.env` and fill in the values you need. Then:

```bash
npm run dev
```

Vite auto-loads `.env` and makes `VITE_*` variables available in the browser.

### Testing Vercel API routes locally

Install the Vercel CLI:

```bash
npm i -g vercel
```

Then run the dev server with Vercel's runtime (from the `articlex/` directory):

```bash
cd articlex
vercel dev
```

This starts a local server that serves both the Vite frontend and the `api/` serverless functions, simulating the production Vercel environment. Your API routes will be available at `http://localhost:3000/api/*`.

### Testing the build

```bash
cd articlex
npm run build
npm run preview
```

---

## Troubleshooting

### "Page not found" on Vercel after deployment

- Make sure **Root Directory** is set to `articlex` in Vercel project settings
- Check that `vercel.json` exists in the `articlex/` directory
- The app uses HashRouter, so URLs look like `/#/features` — this is normal

### Assets not loading on GitHub Pages

- Check that the workflow sets `VITE_BASE_PATH` correctly
- The workflow auto-detects the repo name: `VITE_BASE_PATH=/<repo-name>/`
- Verify in the browser console that asset paths include the repo name

### API routes return 404 on Vercel

- API routes only work when **Root Directory** is set to `articlex`
- Check that `api/health.ts` and `api/payments/verify.ts` exist in `articlex/api/`
- Test the health endpoint: `curl https://your-project.vercel.app/api/health`

### Razorpay modal doesn't appear

- Verify `VITE_RAZORPAY_KEY_ID` is set in Vercel Environment Variables
- Ensure you redeployed after adding the env var
- Check the browser console for Razorpay loading errors
- The `index.html` loads the Razorpay checkout script — ad blockers may block it

### Payment verification fails

- Check that `RAZORPAY_KEY_SECRET` or `STRIPE_SECRET_KEY` is set as a server-only env var in Vercel
- Test the health endpoint (`/api/health`) — it shows which integrations have their secrets configured
- Ensure `VITE_RAZORPAY_VERIFY_ENDPOINT` is set to `/api/payments/verify`

### Build fails with TypeScript errors

```bash
cd articlex
npx tsc -b --noEmit
```

Fix any type errors shown. The build command runs `tsc -b` before `vite build`.

### Environment variables not working

- Frontend vars **must** start with `VITE_` to be exposed to the browser
- Backend vars (without `VITE_`) are only available in Vercel API routes
- After adding env vars in Vercel, you must **redeploy** for them to take effect
- For local dev, vars go in `articlex/.env` (never commit this file)

### Supabase returns 401 on `/rest/v1/`

This usually means one of these is true:

1. `VITE_SUPABASE_ANON_KEY` is wrong or was pasted incompletely
2. You added env vars in Vercel but did **not** redeploy afterwards
3. You only added frontend env vars and skipped `SUPABASE_SERVICE_ROLE_KEY`, so server-side cache/API routes are still under-configured
4. You created the Supabase project but did **not** run `articlex/supabase-setup.sql`, so the expected tables/policies are missing

Quick checks:

1. Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel
2. Verify `SUPABASE_SERVICE_ROLE_KEY` is present for server routes
3. Run the SQL from `articlex/supabase-setup.sql`
4. Redeploy
5. Open `https://your-project.vercel.app/api/health`
