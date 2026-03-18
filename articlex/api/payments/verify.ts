import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'node:crypto'

// ------------------------------------------------------------------
// Razorpay verification
// Requires env: RAZORPAY_KEY_SECRET
// ------------------------------------------------------------------

interface RazorpayPayload {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

function verifyRazorpay(payload: RazorpayPayload): { verified: boolean; message?: string } {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return { verified: false, message: 'Razorpay secret not configured' }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = payload
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return { verified: false, message: 'Missing required Razorpay fields' }
  }

  const body = `${razorpay_order_id}|${razorpay_payment_id}`
  const expected = crypto.createHmac('sha256', secret).update(body).digest('hex')

  return expected === razorpay_signature
    ? { verified: true }
    : { verified: false, message: 'Signature mismatch' }
}

// ------------------------------------------------------------------
// Stripe verification
// Requires env: STRIPE_SECRET_KEY
// ------------------------------------------------------------------

interface StripePayload {
  session_id: string
}

async function verifyStripe(payload: StripePayload): Promise<{ verified: boolean; message?: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY
  if (!secretKey) return { verified: false, message: 'Stripe secret not configured' }

  const { session_id } = payload
  if (!session_id) return { verified: false, message: 'Missing session_id' }

  try {
    const response = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${session_id}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    )

    if (!response.ok) {
      return { verified: false, message: `Stripe API error: ${response.status}` }
    }

    const session = (await response.json()) as { payment_status?: string }
    return session.payment_status === 'paid'
      ? { verified: true }
      : { verified: false, message: `Payment status: ${session.payment_status}` }
  } catch {
    return { verified: false, message: 'Failed to reach Stripe API' }
  }
}

// ------------------------------------------------------------------
// Handler
// POST /api/payments/verify  { provider: "razorpay" | "stripe", ...payload }
// ------------------------------------------------------------------

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    return res.status(204).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ verified: false, message: 'Method not allowed' })
  }

  const { provider, ...payload } = req.body ?? {}

  if (provider === 'razorpay') {
    return res.json(verifyRazorpay(payload as RazorpayPayload))
  }

  if (provider === 'stripe') {
    const result = await verifyStripe(payload as StripePayload)
    return res.json(result)
  }

  return res.status(400).json({ verified: false, message: `Unknown provider: ${provider}` })
}
