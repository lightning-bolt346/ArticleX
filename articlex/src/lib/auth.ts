import { getSupabaseClient, isSupabaseConfigured } from './supabase'
import { checkSupabaseHealth } from './connection'

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

export async function signUp(
  email: string,
  password: string,
  displayName?: string,
): Promise<{ user: AuthUser } | { error: string }> {
  if (!isSupabaseConfigured()) {
    return { error: 'Account creation requires an active connection. Please check your internet and try again.' }
  }

  const healthy = await checkSupabaseHealth()
  if (!healthy) {
    return { error: 'Cannot reach the server right now. Please check your internet connection and try again.' }
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
    return { error: 'Sign in requires an active connection. Please check your internet and try again.' }
  }

  const healthy = await checkSupabaseHealth()
  if (!healthy) {
    return { error: 'Cannot reach the server right now. Please check your internet connection and try again.' }
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
