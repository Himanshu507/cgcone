interface LogoMarkProps {
  size?: number
  className?: string
}

export function LogoMark({ size = 28, className }: LogoMarkProps) {
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
      {/* Converging lines — bold, full opacity */}
      <line x1="7.5"  y1="8.5" x2="16" y2="25" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="16"   y1="8.5" x2="16" y2="25" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="24.5" y1="8.5" x2="16" y2="25" stroke="hsl(var(--primary))" strokeWidth="2.2" strokeLinecap="round" strokeOpacity="0.7" />

      {/* Source nodes — solid, clearly visible */}
      <circle cx="7.5"  cy="8.5" r="3" fill="hsl(var(--primary))" fillOpacity="0.85" />
      <circle cx="16"   cy="8.5" r="3" fill="hsl(var(--primary))" />
      <circle cx="24.5" cy="8.5" r="3" fill="hsl(var(--primary))" fillOpacity="0.85" />

      {/* Apex node — slightly larger, the "one" */}
      <circle cx="16" cy="25" r="4" fill="hsl(var(--primary))" />
    </svg>
  )
}
