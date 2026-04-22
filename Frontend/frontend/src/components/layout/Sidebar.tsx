import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  History,
  Settings,
  Users,
  Terminal,
  Sprout,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

/* ── Nav item definition ──────────────────────────────────── */
interface NavItem {
  label:     string
  path:      string
  icon:      React.ReactNode
  adminOnly: boolean
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard',    path: '/dashboard',    icon: <LayoutDashboard size={18} />, adminOnly: false },
  { label: 'Historique',   path: '/history',      icon: <History          size={18} />, adminOnly: false },
  { label: 'Paramètres',   path: '/settings',     icon: <Settings         size={18} />, adminOnly: true  },
  { label: 'Utilisateurs', path: '/users',        icon: <Users            size={18} />, adminOnly: true  },
  { label: 'Logs Scripts', path: '/script-logs',  icon: <Terminal         size={18} />, adminOnly: true  },
]

/* ── Component ────────────────────────────────────────────── */
export default function Sidebar() {
  const { user } = useAuth()
  const location  = useLocation()
  const [collapsed, setCollapsed] = useState(false)

  const visibleItems = NAV_ITEMS.filter(
    item => !item.adminOnly || user?.role === 'admin'
  )

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 h-screen z-30 flex flex-col transition-all duration-300 ease-in-out',
        collapsed ? 'w-16' : 'w-60'
      )}
      style={{ background: 'var(--bg-sidebar)' }}
    >
      {/* ── Logo ── */}
      <div className="flex items-center gap-3 px-4 h-[60px] border-b border-white/10 flex-shrink-0">
        <div className="w-8 h-8 rounded-lg bg-forest-500 flex items-center justify-center flex-shrink-0">
          <Sprout size={16} className="text-white" />
        </div>
        {!collapsed && (
          <div className="animate-fade-in-left">
            <p className="font-display font-800 text-white text-[0.95rem] leading-tight">
              AgriSmart
            </p>
            <p className="text-white/40 text-[0.65rem] font-mono uppercase tracking-widest">
              UCAC-ICAM
            </p>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto overflow-x-hidden space-y-0.5">
        {/* Section label */}
        {!collapsed && (
          <p className="text-white/30 text-[0.65rem] font-mono uppercase tracking-widest px-3 mb-2">
            Navigation
          </p>
        )}

        {visibleItems.map((item, i) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              cn(
                'sidebar-link',
                isActive && 'active',
                collapsed && 'justify-center px-0',
                `stagger-${Math.min(i + 1, 6)}`
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <span className="sidebar-icon flex-shrink-0">{item.icon}</span>
            {!collapsed && (
              <span className="truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── User info ── */}
      <div className="border-t border-white/10 p-3 flex-shrink-0">
        {!collapsed ? (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs font-display font-700">
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-white/90 text-sm font-medium truncate">
                {user?.username ?? 'Utilisateur'}
              </p>
              <p className="text-white/40 text-xs capitalize">
                {user?.role === 'admin' ? '🛡 Admin' : '👁 Viewer'}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-full bg-forest-600 flex items-center justify-center">
              <span className="text-white text-xs font-display font-700">
                {user?.username?.[0]?.toUpperCase() ?? 'U'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className={cn(
          'absolute -right-3 top-[72px] w-6 h-6 rounded-full',
          'flex items-center justify-center',
          'border border-white/10 text-white/60 hover:text-white',
          'transition-colors duration-150'
        )}
        style={{ background: 'var(--bg-sidebar-active)' }}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed
          ? <ChevronRight size={12} />
          : <ChevronLeft  size={12} />
        }
      </button>
    </aside>
  )
}
