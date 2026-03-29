interface TopBarProps {
  title?: string
}

export default function TopBar({ title = 'ANIMA Nutrition' }: TopBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-14 flex items-center justify-center px-4" style={{ backgroundColor: 'var(--background)' }}>
      <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: 'var(--foreground)' }}>
        {title}
      </span>
    </div>
  )
}
