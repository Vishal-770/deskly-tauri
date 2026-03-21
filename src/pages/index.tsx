import { FormEvent, useEffect, useState } from 'react'
import { useNavigate } from '@/router'
import { useAuth } from '@/hooks/useAuth'

export default function Home() {
  const navigate = useNavigate()
  const { authState, loading, error, login } = useAuth()
  const [regNo, setRegNo] = useState('')
  const [password, setPassword] = useState('')
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    if (authState?.loggedIn) {
      navigate('/dashboard')
    }
  }, [authState, navigate])

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitError(null)
    try {
      await login(regNo, password)
      navigate('/dashboard')
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err))
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground flex items-center justify-center px-4">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm">
        <h1 className="text-2xl font-semibold mb-2">Deskly Login</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Sign in through Tauri backend commands.
        </p>

        <form className="space-y-4" onSubmit={onSubmit}>
          <label className="block text-sm">
            <span className="mb-1 block">Registration Number</span>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={regNo}
              onChange={(event) => setRegNo(event.target.value)}
              placeholder="21BCE1001"
              required
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block">Password</span>
            <input
              type="password"
              className="w-full rounded-md border border-input bg-background px-3 py-2"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              required
            />
          </label>

          {(submitError || error) && (
            <p className="text-sm text-red-500">{submitError ?? error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-primary text-primary-foreground py-2 font-medium disabled:opacity-70"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

      </section>
    </main>
  )
}