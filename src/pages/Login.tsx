import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    navigate('/dashboard')
  }

  async function handleForgotPassword() {
    if (!email) {
      setError('Inserisci la tua email prima di resettare la password')
      return
    }
    setLoading(true)
    setError('')

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })

    if (resetError) {
      setError(resetError.message)
    } else {
      setResetSent(true)
    }
    setLoading(false)
  }

  async function handleGoogleLogin() {
    await supabase.auth.signInWithOAuth({ provider: 'google' })
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-sm flex flex-col gap-8">
        {/* Logo */}
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-widest uppercase" style={{ color: 'var(--foreground)' }}>
            ANIMA
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Nutrition
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 px-4 rounded-[14px] border-none text-base outline-none"
            style={{
              backgroundColor: 'var(--input)',
              color: 'var(--foreground)',
            }}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 px-4 rounded-[14px] border-none text-base outline-none"
            style={{
              backgroundColor: 'var(--input)',
              color: 'var(--foreground)',
            }}
            required
          />

          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--destructive)' }}>
              {error}
            </p>
          )}

          {resetSent && (
            <p className="text-sm text-center" style={{ color: 'var(--accent)' }}>
              Email inviata! Controlla la posta per il link di reset.
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-[52px] rounded-[14px] text-base font-semibold border-none cursor-pointer"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--primary-foreground)',
            }}
          >
            {loading ? 'Accesso...' : 'Accedi'}
          </Button>

          <button
            type="button"
            onClick={handleForgotPassword}
            disabled={loading}
            className="bg-transparent border-none cursor-pointer text-sm"
            style={{ color: 'var(--muted-foreground)' }}
          >
            Password dimenticata?
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
          <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>oppure</span>
          <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        </div>

        {/* Google */}
        <Button
          onClick={handleGoogleLogin}
          variant="ghost"
          className="h-[52px] rounded-[14px] text-base border cursor-pointer"
          style={{
            borderColor: 'var(--border)',
            color: 'var(--foreground)',
          }}
        >
          Continua con Google
        </Button>
      </div>
    </div>
  )
}
