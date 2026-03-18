const toOptionalString = (value: unknown): string | undefined => {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

const joinUrl = (baseUrl: string, path: string): string => {
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  return `${normalizedBase}${normalizedPath}`
}

export const env = {
  basePath: toOptionalString(import.meta.env.VITE_BASE_PATH) ?? '/',
  apiBaseUrl: toOptionalString(import.meta.env.VITE_API_BASE_URL),
  razorpayKeyId: toOptionalString(import.meta.env.VITE_RAZORPAY_KEY_ID),
  stripePublishableKey: toOptionalString(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY),
  clerkPublishableKey: toOptionalString(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY),
  supabaseUrl: toOptionalString(import.meta.env.VITE_SUPABASE_URL),
  supabaseAnonKey: toOptionalString(import.meta.env.VITE_SUPABASE_ANON_KEY),
  firebaseApiKey: toOptionalString(import.meta.env.VITE_FIREBASE_API_KEY),
  firebaseAuthDomain: toOptionalString(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN),
  firebaseProjectId: toOptionalString(import.meta.env.VITE_FIREBASE_PROJECT_ID),
  firebaseStorageBucket: toOptionalString(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET),
  firebaseMessagingSenderId: toOptionalString(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
  firebaseAppId: toOptionalString(import.meta.env.VITE_FIREBASE_APP_ID),
  stripeVerifyEndpoint: toOptionalString(import.meta.env.VITE_STRIPE_VERIFY_ENDPOINT),
  razorpayVerifyEndpoint: toOptionalString(import.meta.env.VITE_RAZORPAY_VERIFY_ENDPOINT),
}

export const integrationAvailability = {
  razorpay: Boolean(env.razorpayKeyId),
  stripe: Boolean(env.stripePublishableKey),
  clerk: Boolean(env.clerkPublishableKey),
  supabase: Boolean(env.supabaseUrl && env.supabaseAnonKey),
  firebase: Boolean(env.firebaseApiKey && env.firebaseProjectId && env.firebaseAppId),
}

export const resolveEndpoint = (pathOrUrl?: string): string | undefined => {
  if (!pathOrUrl) return undefined
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl
  if (!env.apiBaseUrl) return pathOrUrl
  return joinUrl(env.apiBaseUrl, pathOrUrl)
}
