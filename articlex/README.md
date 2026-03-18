# ArticleX (app package)

ArticleX is a client-side React SPA that converts X/Twitter post URLs into readable exports.

## Local development

Run everything from this folder:

```bash
npm ci
npm run dev
```

Useful commands:

```bash
npm run lint
npm run build
npm run preview
```

## Environment variables

Copy and edit:

```bash
cp .env.example .env.local
```

Most deployments only need `VITE_BASE_PATH=/`.

Optional integration keys:

- `VITE_RAZORPAY_KEY_ID`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_CLERK_PUBLISHABLE_KEY`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- Firebase `VITE_FIREBASE_*` keys

Optional payment verification endpoints:

- `VITE_RAZORPAY_VERIFY_ENDPOINT`
- `VITE_STRIPE_VERIFY_ENDPOINT`
- Optional shared prefix: `VITE_API_BASE_URL`

### Payment verification behavior

- If verification endpoints are **not** set, successful payment callbacks are accepted client-side (current behavior).
- If endpoints are set, the frontend sends a POST request and only treats payment as successful when backend verification returns `{ "verified": true }`.

This makes it easy to move to secure backend verification later (recommended for production billing).

Example verification request payload (Razorpay):

```json
{
  "provider": "razorpay",
  "paymentId": "pay_xxx",
  "orderId": "order_xxx",
  "signature": "signature_xxx",
  "amount": 99,
  "currency": "INR"
}
```

## Deploying this folder to Vercel directly

1. Import repo in Vercel.
2. Set **Root Directory** to `articlex`.
3. Build settings:
   - Install command: `npm ci`
   - Build command: `npm run build`
   - Output directory: `dist`
4. Add environment variables in Project Settings.
5. Deploy.

## Notes

- Vite `base` is now controlled by `VITE_BASE_PATH` (defaults to `/`).
- Router uses `HashRouter`, so no SPA rewrite config is required for client routes.
