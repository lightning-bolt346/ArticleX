import { useCallback, useEffect, useState } from 'react'
import {
  getStoredUser,
  getStoredUserSync,
  logoutUser,
  signIn,
  signUp,
  type AuthUser,
} from '../lib/auth'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getStoredUserSync)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getStoredUser()
      .then(setUser)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const handler = () => {
      getStoredUser().then(setUser).catch(() => {})
    }
    window.addEventListener('articlex-auth-changed', handler)
    return () => window.removeEventListener('articlex-auth-changed', handler)
  }, [])

  const login = useCallback(async (email: string, password: string) => {
    return signIn(email, password)
  }, [])

  const register = useCallback(async (email: string, password: string, displayName?: string) => {
    return signUp(email, password, displayName)
  }, [])

  const logout = useCallback(async () => {
    await logoutUser()
    setUser(null)
  }, [])

  return { user, isLoggedIn: user !== null, loading, login, register, logout }
}
