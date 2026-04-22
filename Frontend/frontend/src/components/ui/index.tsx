import { cn } from '@/lib/utils'
import { X, Loader2 } from 'lucide-react'
import { useEffect, useRef } from 'react'

/* ══════════════════════════════════════════════════════════
   BADGE
══════════════════════════════════════════════════════════ */
type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'admin' | 'viewer'

const badgeStyles: Record<BadgeVariant, string> = {
  success: 'bg-green-50  text-green-700  border border-green-200',
  warning: 'bg-amber-50  text-amber-700  border border-amber-200',
  danger:  'bg-red-50    text-red-700    border border-red-200',
  info:    'bg-blue-50   text-blue-700   border border-blue-200',
  neutral: 'bg-[color:var(--bg-surface-2)] text-[color:var(--text-secondary)] border border-[color:var(--border-default)]',
  admin:   'bg-forest-50 text-forest-700 border border-forest-200',
  viewer:  'bg-soil-100  text-soil-600   border border-soil-200',
}

interface BadgeProps {
  variant?:   BadgeVariant
  children:   React.ReactNode
  className?: string
  dot?:       boolean
}

export function Badge({ variant = 'neutral', children, className, dot }: BadgeProps) {
  return (
    <span className={cn('badge', badgeStyles[variant], className)}>
      {dot && (
        <span
          className={cn(
            'w-1.5 h-1.5 rounded-full',
            variant === 'success' && 'bg-green-500',
            variant === 'warning' && 'bg-amber-500',
            variant === 'danger'  && 'bg-red-500',
            variant === 'info'    && 'bg-blue-500',
            variant === 'neutral' && 'bg-soil-400',
          )}
        />
      )}
      {children}
    </span>
  )
}


/* ══════════════════════════════════════════════════════════
   BUTTON
══════════════════════════════════════════════════════════ */
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
type ButtonSize    = 'sm' | 'md' | 'lg'

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:   ButtonVariant
  size?:      ButtonSize
  loading?:   boolean
  icon?:      React.ReactNode
  iconRight?: React.ReactNode
}

export function Button({
  variant    = 'primary',
  size       = 'md',
  loading    = false,
  icon,
  iconRight,
  children,
  className,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'btn',
        `btn-${variant}`,
        sizeStyles[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : icon
      }
      {children}
      {!loading && iconRight}
    </button>
  )
}


/* ══════════════════════════════════════════════════════════
   INPUT
══════════════════════════════════════════════════════════ */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string
  error?:    string
  hint?:     string
  icon?:     React.ReactNode
}

export function Input({ label, error, hint, icon, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[color:var(--text-primary)]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--text-tertiary)]">
            {icon}
          </span>
        )}
        <input
          className={cn(
            'input-base',
            icon && 'pl-10',
            error && 'border-red-400 focus:border-red-500 focus:shadow-none',
            className
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      )}
      {hint && !error && (
        <p className="text-xs text-[color:var(--text-tertiary)]">{hint}</p>
      )}
    </div>
  )
}


/* ══════════════════════════════════════════════════════════
   SELECT
══════════════════════════════════════════════════════════ */
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?:    string
  error?:    string
  options:   { value: string; label: string }[]
}

export function Select({ label, error, options, className, ...props }: SelectProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label className="text-sm font-medium text-[color:var(--text-primary)]">
          {label}
        </label>
      )}
      <select
        className={cn(
          'input-base appearance-none',
          error && 'border-red-400',
          className
        )}
        {...props}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-600">⚠ {error}</p>
      )}
    </div>
  )
}


/* ══════════════════════════════════════════════════════════
   MODAL
══════════════════════════════════════════════════════════ */
interface ModalProps {
  open:       boolean
  onClose:    () => void
  title?:     string
  children:   React.ReactNode
  size?:      'sm' | 'md' | 'lg'
  footer?:    React.ReactNode
}

const modalSizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg' }

export function Modal({ open, onClose, title, children, size = 'md', footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(26,21,16,0.55)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === overlayRef.current) onClose() }}
    >
      <div
        className={cn(
          'card w-full animate-fade-in',
          modalSizes[size]
        )}
        style={{ padding: 0 }}
      >
        {/* Header */}
        {title && (
          <div
            className="flex items-center justify-between px-5 py-4 border-b"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            <h3 className="font-display font-700 text-base">{title}</h3>
            <button
              onClick={onClose}
              className="btn btn-ghost p-1 rounded-lg"
              aria-label="Close"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {/* Body */}
        <div className="p-5">{children}</div>

        {/* Footer */}
        {footer && (
          <div
            className="px-5 py-4 border-t flex items-center justify-end gap-2"
            style={{ borderColor: 'var(--border-subtle)' }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}


/* ══════════════════════════════════════════════════════════
   TABLE
══════════════════════════════════════════════════════════ */
interface Column<T> {
  key:       string
  header:    string
  render?:   (row: T) => React.ReactNode
  className?: string
}

interface TableProps<T> {
  columns:    Column<T>[]
  data:       T[]
  keyField:   keyof T
  loading?:   boolean
  emptyText?: string
  onRowClick?: (row: T) => void
}

export function Table<T>({
  columns,
  data,
  keyField,
  loading    = false,
  emptyText  = 'Aucune donnée',
  onRowClick,
}: TableProps<T>) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {columns.map(col => (
              <th
                key={col.key}
                className={cn(
                  'text-left px-4 py-3 text-xs font-600 uppercase tracking-wider',
                  col.className
                )}
                style={{ color: 'var(--text-tertiary)' }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="skeleton h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="text-center py-12 text-sm"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map(row => (
              <tr
                key={String(row[keyField])}
                className={cn(
                  'transition-colors',
                  onRowClick && 'cursor-pointer hover:bg-[color:var(--bg-surface-2)]'
                )}
                style={{ borderBottom: '1px solid var(--border-subtle)' }}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map(col => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-sm', col.className)}
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '—')
                    }
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}


/* ══════════════════════════════════════════════════════════
   TABS
══════════════════════════════════════════════════════════ */
interface Tab {
  key:   string
  label: string
  icon?: React.ReactNode
}

interface TabsProps {
  tabs:      Tab[]
  active:    string
  onChange:  (key: string) => void
}

export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div
      className="flex items-center gap-1 p-1 rounded-xl w-fit"
      style={{ background: 'var(--bg-surface-2)' }}
    >
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-150',
            active === tab.key
              ? 'bg-white text-[color:var(--text-primary)] shadow-sm'
              : 'text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]'
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
