import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    integrations: {
      razorpay: Boolean(process.env.RAZORPAY_KEY_SECRET),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      supabase: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      clerk: Boolean(process.env.CLERK_SECRET_KEY),
    },
  })
}
