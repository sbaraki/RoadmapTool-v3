import type { ReactNode } from 'react'

interface ChipProps {
  children: ReactNode
  color?: string
  className?: string
}

export function Chip({ children, color, className = '' }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center text-label-md uppercase tracking-wide rounded-xl px-2 py-0.5 ${className}`}
      style={{
        color: color ?? 'inherit',
        backgroundColor: color ? `${color}1a` : undefined,
      }}
    >
      {children}
    </span>
  )
}
