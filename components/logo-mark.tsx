interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 20, className }: LogoMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* Apex glow */}
      <circle cx="16" cy="24.5" r="7.5" fill="hsl(var(--primary))" fillOpacity="0.13" />

      {/* Source-layer connector */}
      <line x1="7.5" y1="9" x2="24.5" y2="9" stroke="hsl(var(--primary))" strokeWidth="1" strokeOpacity="0.28" />

      {/* Converging lines */}
      <line x1="7.5"  y1="9" x2="16" y2="24.5" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />
      <line x1="16"   y1="9" x2="16" y2="24.5" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.80" />
      <line x1="24.5" y1="9" x2="16" y2="24.5" stroke="hsl(var(--primary))" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.55" />

      {/* Source nodes */}
      <circle cx="7.5"  cy="9" r="2.5" fill="hsl(var(--primary))" fillOpacity="0.72" />
      <circle cx="16"   cy="9" r="2.5" fill="hsl(var(--primary))" />
      <circle cx="24.5" cy="9" r="2.5" fill="hsl(var(--primary))" fillOpacity="0.72" />

      {/* Apex node */}
      <circle cx="16" cy="24.5" r="3.5" fill="hsl(var(--primary))" />
    </svg>
  )
}
