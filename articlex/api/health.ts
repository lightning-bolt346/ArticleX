import type { VercelRequest, VercelResponse } from '@vercel/node'

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    integrations: {
      razorpay: Boolean(process.env.RAZORPAY_KEY_SECRET),
      stripe: Boolean(process.env.STRIPE_SECRET_KEY),
      supabase: {
        browser: Boolean(supabaseUrl && supabaseAnonKey),
        serverCache: Boolean(supabaseUrl && (supabaseServiceRoleKey ?? supabaseAnonKey)),
        serviceRole: Boolean(supabaseServiceRoleKey),
      },
      clerk: Boolean(process.env.CLERK_SECRET_KEY),
    },
  })
}
