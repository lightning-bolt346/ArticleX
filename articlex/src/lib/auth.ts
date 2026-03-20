const AUTH_KEY = 'articlex-auth-v1'

export interface AuthUser {
  id: string
  email: string
  displayName: string
}

interface StoredAuth {
  user: AuthUser
  loggedInAt: string
}

function readAuth(): StoredAuth | null {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredAuth
    if (!parsed?.user?.id || !parsed?.user?.email) return null
    return parsed
  } catch {
    return null
  }
}

export function getStoredUser(): AuthUser | null {
  return readAuth()?.user ?? null
}

export function loginUser(email: string, displayName?: string): AuthUser {
  const id = email.toLowerCase().replace(/[^a-z0-9]/g, '_')
  const user: AuthUser = {
    id,
    email: email.toLowerCase(),
    displayName: displayName || email.split('@')[0],
  }
  const stored: StoredAuth = { user, loggedInAt: new Date().toISOString() }
  localStorage.setItem(AUTH_KEY, JSON.stringify(stored))
  window.dispatchEvent(new Event('articlex-auth-changed'))
  return user
}

export function logoutUser(): void {
  localStorage.removeItem(AUTH_KEY)
  window.dispatchEvent(new Event('articlex-auth-changed'))
}
