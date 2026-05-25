import type { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  wide?: boolean
}

export function Modal({ open, onClose, title, children, wide }: ModalProps) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center no-print"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="absolute inset-0 bg-black/10" onClick={onClose} />

      <div
        className={`relative glass-panel rounded-xl shadow-2xl max-h-[85vh] overflow-y-auto ${
          wide ? 'w-[720px]' : 'w-[540px]'
        } max-w-[95vw]`}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <h2 className="text-headline-sm text-slate-text">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-surface-container transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}
