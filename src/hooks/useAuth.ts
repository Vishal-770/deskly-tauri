import { useCallback, useEffect, useState } from 'react'
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

export type UseAuthReturn = {
  /** Current authentication state from the backend */
  authState: AuthState | null
  /** Whether an async auth operation is in progress */
  loading: boolean
  /** Last error message, or null */
  error: string | null
  /** Whether tokens are currently stored */
  hasTokens: boolean
  /** Shorthand — true when authState.loggedIn is true */
  isLoggedIn: boolean
  /** Login with registration number and password */
  login: (regNo: string, password: string) => Promise<void>
  /** Logout — clears ALL auth data (state + tokens + disk) */
  logout: () => Promise<void>
  /** Re-fetch auth state from the backend store */
  refresh: () => Promise<void>
  /** Fetch current tokens from the backend */
  fetchTokens: () => Promise<AuthTokens | null>
  /** Persist new tokens to the backend */
  setTokens: (tokens: AuthTokens) => Promise<void>
  /** Delete stored tokens (but keep auth state) */
  clearTokens: () => Promise<void>
}

/**
 * Standalone hook for all auth operations.
 *
 * Can be used with or without the `<AuthProvider>` context —
 * it talks directly to the Tauri backend via invoke.
 */
export function useAuth(): UseAuthReturn {
  const [authState, setAuthState] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [hasTokens, setHasTokens] = useState(false)

  const isLoggedIn = authState?.loggedIn ?? false

  // ---------- internal helpers ----------

  const handleError = useCallback((err: unknown): string => {
    const msg = err instanceof Error ? err.message : String(err)
    setError(msg)
    return msg
  }, [])

  /** Probe the backend for token existence and update `hasTokens`. */
  const syncTokenStatus = useCallback(async () => {
    try {
      const tokens = await authGetTokens()
      setHasTokens(tokens !== null)
    } catch {
      setHasTokens(false)
    }
  }, [])

  // ---------- public API ----------

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const restored = await authRestoreSession()
      if (restored) {
        setAuthState(restored)
      } else {
        setAuthState(await authGetState())
      }
      await syncTokenStatus()
    } catch (err) {
      handleError(err)
      setAuthState(null)
    } finally {
      setLoading(false)
    }
  }, [handleError, syncTokenStatus])

  const login = useCallback(
    async (regNo: string, password: string) => {
      setLoading(true)
      setError(null)
      try {
        const response = await authLogin(regNo, password)
        setAuthState(response.state)
        setHasTokens(true)
      } catch (err) {
        handleError(err)
        throw err
      } finally {
        setLoading(false)
      }
    },
    [handleError],
  )

  const logout = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      await authLogout()
      setAuthState(null)
      setHasTokens(false)
    } catch (err) {
      handleError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [handleError])

  const fetchTokens = useCallback(async (): Promise<AuthTokens | null> => {
    try {
      const tokens = await authGetTokens()
      setHasTokens(tokens !== null)
      return tokens
    } catch (err) {
      handleError(err)
      return null
    }
  }, [handleError])

  const setTokens = useCallback(
    async (tokens: AuthTokens) => {
      try {
        await authSetTokens(tokens)
        setHasTokens(true)
      } catch (err) {
        handleError(err)
        throw err
      }
    },
    [handleError],
  )

  const clearTokens = useCallback(async () => {
    try {
      await authClearTokens()
      setHasTokens(false)
    } catch (err) {
      handleError(err)
      throw err
    }
  }, [handleError])

  // ---------- bootstrap ----------

  useEffect(() => {
    void refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return {
    authState,
    loading,
    error,
    hasTokens,
    isLoggedIn,
    login,
    logout,
    refresh,
    fetchTokens,
    setTokens,
    clearTokens,
  }
}
