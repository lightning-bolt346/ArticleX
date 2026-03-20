import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import { env } from './env'

export interface AuthUser {
  id: string
  email: string
  displayName: string
}

const AUTH_EVENT = 'articlex-auth-changed'
const LOCAL_KEY = 'articlex-auth-v1'

function notifyChange() {
  window.dispatchEvent(new Event(AUTH_EVENT))
}

function readLocal(): AuthUser | null {
  try {
    const raw = localStorage.getItem(LOCAL_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { user?: AuthUser }
    return parsed?.user?.id ? parsed.user : null
  } catch {
    return null
  }
}

function writeLocal(user: AuthUser | null) {
  if (user) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify({ user, loggedInAt: new Date().toISOString() }))
  } else {
    localStorage.removeItem(LOCAL_KEY)
  }
}

export async function getStoredUser(): Promise<AuthUser | null> {
  const supabase = getSupabaseClient()
  if (supabase) {
    try {
      const { data } = await supabase.auth.getUser()
      if (data.user) {
        const user: AuthUser = {
          id: data.user.id,
          email: data.user.email ?? '',
          displayName:
            (data.user.user_metadata?.display_name as string) ??
            (data.user.email?.split('@')[0] ?? ''),
        }
        writeLocal(user)
        return user
      }
    } catch { /* Supabase unreachable — fall back to local cache */ }
  }
  return readLocal()
}

export function getStoredUserSync(): AuthUser | null {
  return readLocal()
}

async function canReachAuth(): Promise<boolean> {
  if (!env.supabaseUrl) return false
  try {
    const res = await fetch(`${env.supabaseUrl}/auth/v1/settings`, {
      headers: { 'apikey': env.supabaseAnonKey! },
      signal: AbortSignal.timeout(5000),
    })
    return res.ok
  } catch {
    return false
  }
}

export async function signUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ user: AuthUser } | { error: string }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Sign up requires a server connection. Please try again in a moment.' }
  }

  if (!navigator.onLine) {
    return { error: 'You appear to be offline. Please check your internet connection.' }
  }

  const reachable = await canReachAuth()
  if (!reachable) {
    return { error: 'Our authentication service is temporarily unavailable. We\'re working on it — please try again shortly.' }
  }

  const supabase = getSupabaseClient()!
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name: displayName ?? email.split('@')[0] } },
  })
  if (error) return { error: error.message }
  if (!data.user) return { error: 'Sign up failed. Please try again.' }

  const user: AuthUser = {
    id: data.user.id,
    email: data.user.email ?? email,
    displayName: displayName ?? email.split('@')[0],
  }
  writeLocal(user)
  notifyChange()
  return { user }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: AuthUser } | { error: string }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Sign in requires a server connection. Please try again in a moment.' }
  }

  if (!navigator.onLine) {
    return { error: 'You appear to be offline. Please check your internet connection.' }
  }

  const reachable = await canReachAuth()
  if (!reachable) {
    return { error: 'Our authentication service is temporarily unavailable. We\'re working on it — please try again shortly.' }
  }

  const supabase = getSupabaseClient()!
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return { error: error.message }
  if (!data.user) return { error: 'Sign in failed.' }

  const user: AuthUser = {
    id: data.user.id,
    email: data.user.email ?? email,
    displayName:
      (data.user.user_metadata?.display_name as string) ??
      email.split('@')[0],
  }
  writeLocal(user)
  notifyChange()
  return { user }
}

export async function logoutUser(): Promise<void> {
  const supabase = getSupabaseClient()
  if (supabase) {
    await supabase.auth.signOut().catch(() => {})
  }
  writeLocal(null)
  notifyChange()
}
