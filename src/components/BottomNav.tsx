import { useLocation, useNavigate } from 'react-router-dom'
import { House, Plus, CookingPot, ChartLine, GearSix } from '@phosphor-icons/react'
import { useProfile } from '@/hooks/useProfile'

const clientItems = [
  { path: '/dashboard', label: 'Home', Icon: House },
  { path: '/log', label: 'Log', Icon: Plus, primary: true },
  { path: '/recipes', label: 'Recipes', Icon: CookingPot },
  { path: '/progress', label: 'Progress', Icon: ChartLine },
  { path: '/settings', label: 'Settings', Icon: GearSix },
]

const adminItems = [
  { path: '/dashboard', label: 'Home', Icon: House },
  { path: '/log', label: 'Log', Icon: Plus, primary: true },
  { path: '/recipes', label: 'Recipes', Icon: CookingPot },
  { path: '/progress', label: 'Progress', Icon: ChartLine },
  { path: '/admin', label: 'Admin', Icon: GearSix },
]

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { profile } = useProfile()

  const items = profile?.role === 'admin' ? adminItems : clientItems

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 h-[72px] flex items-center justify-around px-2 pb-safe" style={{ backgroundColor: 'var(--background)', borderTop: '1px solid var(--border)' }}>
      {items.map(({ path, label, Icon, primary }) => {
        const active = location.pathname === path
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className="flex flex-col items-center justify-center gap-0.5 w-16 h-full bg-transparent border-none cursor-pointer"
          >
            {primary ? (
              <div
                className="flex items-center justify-center w-10 h-10 rounded-full"
                style={{ backgroundColor: 'var(--accent)' }}
              >
                <Icon size={22} weight="bold" color="var(--primary-foreground)" />
              </div>
            ) : (
              <Icon
                size={22}
                weight={active ? 'fill' : 'regular'}
                color={active ? 'var(--accent)' : 'var(--muted-foreground)'}
              />
            )}
            <span
              className="text-[10px]"
              style={{ color: primary ? 'var(--accent)' : active ? 'var(--accent)' : 'var(--muted-foreground)' }}
            >
              {label}
            </span>
          </button>
        )
      })}
    </nav>
  )
}
