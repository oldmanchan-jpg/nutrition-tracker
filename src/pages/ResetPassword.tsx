import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    // Supabase client auto-detects the recovery token from the URL hash
    // and exchanges it for a session via onAuthStateChange
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    // Also check if session already exists (token was already exchanged)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true)
    })

    return () => subscription.unsubscribe()
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password.length < 6) {
      setError('La password deve avere almeno 6 caratteri')
      return
    }

    if (password !== confirm) {
      setError('Le password non corrispondono')
      return
    }

    setLoading(true)

    const { error: updateError } = await supabase.auth.updateUser({
      password,
    })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => navigate('/login'), 2000)
  }

  if (!sessionReady) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-bold tracking-widest uppercase mb-2" style={{ color: 'var(--foreground)' }}>
            ANIMA
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Verifica del link in corso...
          </p>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="h-dvh flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--background)' }}>
        <div className="w-full max-w-sm text-center flex flex-col gap-4">
          <h1 className="text-2xl font-bold tracking-widest uppercase" style={{ color: 'var(--foreground)' }}>
            ANIMA
          </h1>
          <p className="text-sm" style={{ color: 'var(--accent)' }}>
            Password aggiornata con successo!
          </p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Reindirizzamento al login...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-dvh flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--background)' }}>
      <div className="w-full max-w-sm flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold tracking-widest uppercase" style={{ color: 'var(--foreground)' }}>
            ANIMA
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Nuova Password
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="password"
            placeholder="Nuova password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 px-4 rounded-[14px] border-none text-base outline-none"
            style={{
              backgroundColor: 'var(--input)',
              color: 'var(--foreground)',
            }}
            required
            minLength={6}
          />
          <input
            type="password"
            placeholder="Conferma password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className="h-12 px-4 rounded-[14px] border-none text-base outline-none"
            style={{
              backgroundColor: 'var(--input)',
              color: 'var(--foreground)',
            }}
            required
            minLength={6}
          />

          {error && (
            <p className="text-sm text-center" style={{ color: 'var(--destructive)' }}>
              {error}
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
            {loading ? 'Aggiornamento...' : 'Aggiorna Password'}
          </Button>
        </form>
      </div>
    </div>
  )
}
