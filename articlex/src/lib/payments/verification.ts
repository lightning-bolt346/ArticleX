import { env, resolveEndpoint } from '../env'

export type PaymentProvider = 'stripe' | 'razorpay'

export type PaymentVerificationResult =
  | { status: 'skipped'; reason: 'no-endpoint' }
  | { status: 'verified' }
  | { status: 'failed'; reason: 'network-error' | 'rejected'; message?: string }

export interface VerifyPaymentParams {
  provider: PaymentProvider
  payload: Record<string, unknown>
}

const providerEndpointMap: Record<PaymentProvider, string | undefined> = {
  stripe: env.stripeVerifyEndpoint,
  razorpay: env.razorpayVerifyEndpoint,
}

export const getPaymentVerificationEndpoint = (provider: PaymentProvider): string | undefined =>
  resolveEndpoint(providerEndpointMap[provider])

export const verifyPayment = async ({
  provider,
  payload,
}: VerifyPaymentParams): Promise<PaymentVerificationResult> => {
  const endpoint = getPaymentVerificationEndpoint(provider)
  if (!endpoint) {
    return { status: 'skipped', reason: 'no-endpoint' }
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, ...payload }),
    })

    if (!response.ok) {
      return { status: 'failed', reason: 'rejected', message: `HTTP ${response.status}` }
    }

    const data = (await response.json().catch(() => ({}))) as { verified?: boolean; message?: string }
    if (data.verified === true) {
      return { status: 'verified' }
    }

    return { status: 'failed', reason: 'rejected', message: data.message ?? 'Verification failed' }
  } catch {
    return { status: 'failed', reason: 'network-error' }
  }
}
