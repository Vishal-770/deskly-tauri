import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@/router'
import { useAuth } from '@/hooks/useAuth'
import { type AuthTokens } from '@/lib/tauri-auth'

export default function DashBoardPage() {
  const navigate = useNavigate()
  const { authState, loading, logout, fetchTokens } = useAuth()
  const [tokens, setTokenState] = useState<AuthTokens | null>(null)

  useEffect(() => {
    if (!loading && !authState?.loggedIn) {
      navigate('/')
    }
  }, [authState, loading, navigate])

  useEffect(() => {
    const loadTokens = async () => {
      const currentTokens = await fetchTokens()
      setTokenState(currentTokens)
    }

    void loadTokens()
  }, [fetchTokens])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  if (loading || !authState?.loggedIn) {
    return <main className="p-6">Loading dashboard...</main>
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 p-6">
      <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Logged in as <strong>{authState.userId}</strong>
            </p>
          </div>

          <button
            className="rounded-md bg-destructive text-white px-4 py-2"
            onClick={handleLogout}
          >
            Logout
          </button>
        </header>

        <section className="rounded-xl border border-border bg-card p-5 space-y-2">
          <h2 className="font-medium">Session</h2>
          <p className="text-sm text-muted-foreground">
            lastLogin: {new Date(authState.lastLogin).toLocaleString()}
          </p>
        </section>

        <section className="rounded-xl border border-border bg-card p-5 space-y-4">
          <h2 className="font-medium">Auth Tokens</h2>
          <p className="text-sm text-muted-foreground">
            Tokens are fetched automatically from backend login.
          </p>

          <pre className="text-xs bg-muted rounded-md p-3 overflow-x-auto">
            {JSON.stringify(tokens, null, 2)}
          </pre>
        </section>

        <p className="text-sm">
          <Link to="/">Back to login</Link>
        </p>
    </div>
  )
}