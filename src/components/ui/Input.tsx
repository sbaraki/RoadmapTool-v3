import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export function Input({ label, error, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-label-md text-slate-muted uppercase tracking-wide">{label}</label>
      )}
      <input
        className={`border border-outline-variant rounded-md px-3 py-1.5 text-body-md text-slate-text bg-white
          placeholder:text-slate-muted/50 focus:outline-2 focus:outline-secondary/40 transition-shadow
          ${error ? 'border-error focus:outline-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="text-body-sm text-error">{error}</span>}
    </div>
  )
}
