interface MacroRingProps {
  label: string
  current: number
  target: number
  unit?: string
  size?: number
  strokeWidth?: number
}

export default function MacroRing({
  label,
  current,
  target,
  unit = '',
  size = 48,
  strokeWidth = 4,
}: MacroRingProps) {
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const progress = target > 0 ? Math.min(current / target, 1) : 0
  const offset = circumference - progress * circumference

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--muted-foreground)"
            strokeWidth={strokeWidth}
            opacity={0.2}
          />
          {/* Progress */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--accent)"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-xs font-medium" style={{ color: 'var(--foreground)', fontSize: size > 56 ? '14px' : '10px' }}>
            {current.toLocaleString()}
          </span>
        </div>
      </div>
      <div className="text-center">
        <div className="font-mono text-[10px]" style={{ color: 'var(--muted-foreground)' }}>
          /{target.toLocaleString()}{unit}
        </div>
        <div className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--muted-foreground)' }}>
          {label}
        </div>
      </div>
    </div>
  )
}
