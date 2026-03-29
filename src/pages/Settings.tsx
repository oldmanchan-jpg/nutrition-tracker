import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/hooks/useProfile'
import { Button } from '@/components/ui/button'
import { SignOut, Moon, Sun } from '@phosphor-icons/react'

export default function Settings() {
  const { profile } = useProfile()
  const navigate = useNavigate()
  const [isDark, setIsDark] = useState(!document.documentElement.classList.contains('light'))

  function toggleTheme() {
    if (isDark) {
      document.documentElement.classList.add('light')
    } else {
      document.documentElement.classList.remove('light')
    }
    setIsDark(!isDark)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div className="content-area flex flex-col">
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {/* Profile section */}
        <div className="mt-6 mb-6">
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Profilo
          </h2>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
            <div className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
              {profile?.full_name || 'User'}
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              {profile?.email}
            </div>
          </div>
        </div>

        {/* Appearance */}
        <div className="mb-6">
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Aspetto
          </h2>
          <button
            onClick={toggleTheme}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-transparent border-none cursor-pointer"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <span className="text-sm" style={{ color: 'var(--foreground)' }}>
              {isDark ? 'Tema Scuro' : 'Tema Chiaro'}
            </span>
            {isDark ? (
              <Moon size={20} weight="duotone" color="var(--accent)" />
            ) : (
              <Sun size={20} weight="duotone" color="var(--accent)" />
            )}
          </button>
        </div>

        {/* App info */}
        <div className="mb-8">
          <h2 className="text-xs font-semibold tracking-widest uppercase mb-3" style={{ color: 'var(--muted-foreground)' }}>
            Info
          </h2>
          <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
            <div className="text-sm" style={{ color: 'var(--foreground)' }}>
              ANIMA Nutrition
            </div>
            <div className="font-mono text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
              v0.1.0
            </div>
          </div>
        </div>

        {/* Sign out */}
        <Button
          onClick={handleSignOut}
          variant="ghost"
          className="w-full h-[52px] rounded-[14px] text-base font-semibold cursor-pointer flex items-center justify-center gap-2"
          style={{
            border: '1px solid var(--destructive)',
            color: 'var(--destructive)',
          }}
        >
          <SignOut size={20} weight="bold" />
          Esci
        </Button>
      </div>
    </div>
  )
}
