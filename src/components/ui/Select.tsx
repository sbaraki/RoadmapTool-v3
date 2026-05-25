import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}

export function Select({ label, options, className = '', ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-label-md text-slate-muted uppercase tracking-wide">{label}</label>
      )}
      <select
        className={`border border-outline-variant rounded-md px-3 py-1.5 text-body-md text-slate-text bg-white
          focus:outline-2 focus:outline-secondary/40 transition-shadow ${className}`}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}
