import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import {
  authClearTokens,
  authGetState,
  authGetTokens,
  authLogin,
  authLogout,
  authRestoreSession,
  authSetTokens,
  type AuthState,
  type AuthTokens,
} from '@/lib/tauri-auth'

type AuthContextValue = {
  authState: AuthState | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  getTokens: () => Promise<AuthTokens | null>
  setTokens: (tokens: AuthTokens) => Promise<void>
  clearTokens: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = async () => {
    setLoading(true)
    setError(null)
    try {
      const restored = await authRestoreSession()
      if (restored) {
        setAuthState(restored)
      } else {
        setAuthState(await authGetState())
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      setAuthState(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const state = await authLogin(username, password)
      setAuthState(state)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    setLoading(true)
    setError(null)
    try {
      await authLogout()
      setAuthState(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
      throw err
    } finally {
      setLoading(false)
    }
  }

  const getTokens = async () => authGetTokens()

  const setTokens = async (tokens: AuthTokens) => {
    await authSetTokens(tokens)
  }

  const clearTokens = async () => {
    await authClearTokens()
  }

  const value = useMemo(
    () => ({
      authState,
      loading,
      error,
      login,
      logout,
      refresh,
      getTokens,
      setTokens,
      clearTokens,
    }),
    [authState, loading, error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return context
}

