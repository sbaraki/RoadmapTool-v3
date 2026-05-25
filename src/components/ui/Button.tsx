import type { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', children, className = '', ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700 cursor-pointer select-none'

  const variants: Record<string, string> = {
    primary: 'bg-slate-text text-white hover:bg-slate-text/90',
    secondary: 'border border-slate-muted text-slate-muted hover:bg-surface-container',
    ghost: 'text-slate-muted hover:bg-surface-container',
    danger: 'bg-error text-white hover:bg-error/90',
  }

  const sizes: Record<string, string> = {
    sm: 'text-body-sm px-2 py-1 rounded',
    md: 'text-body-md px-3 py-1.5 rounded-md',
    lg: 'text-body-lg px-4 py-2 rounded-md',
  }

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
