import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  label: string
  active?: boolean
  disabled?: boolean
}

export function IconButton({ children, label, active, disabled, className = '', ...props }: IconButtonProps) {
  return (
    <button
      aria-label={label}
      title={label}
      disabled={disabled}
      className={`p-1.5 rounded-md transition-colors cursor-pointer
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${active ? 'bg-surface-container-high text-slate-text' : 'text-slate-muted hover:bg-surface-container hover:text-slate-text'}
        ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
