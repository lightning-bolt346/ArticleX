import { useCallback, useEffect, useState } from 'react'
import { getStoredUser, loginUser, logoutUser, type AuthUser } from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUser)

  useEffect(() => {
    const handler = () => setUser(getStoredUser())
    window.addEventListener('articlex-auth-changed', handler)
    return () => window.removeEventListener('articlex-auth-changed', handler)
  }, [])

  const login = useCallback((email: string, displayName?: string) => {
    const u = loginUser(email, displayName)
    setUser(u)
    return u
  }, [])

  const logout = useCallback(() => {
    logoutUser()
    setUser(null)
  }, [])

  return { user, isLoggedIn: user !== null, login, logout }
}
