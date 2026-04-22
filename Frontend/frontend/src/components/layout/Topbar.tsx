import { Bell, LogOut, Globe, Sun, Moon } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '@/hooks/index'
import { useAlerts } from '@/hooks/index'
import { useTranslation } from '@/hooks/index'
import { cn } from '@/lib/utils'

interface TopbarProps {
  sidebarCollapsed?: boolean
}

export default function Topbar({ sidebarCollapsed = false }: TopbarProps) {
  const { user, logout }          = useAuth()
  const { unacknowledgedCount }   = useAlerts()
  const { language, setLanguage } = useTranslation()
  const [darkMode, setDarkMode]   = useState(false)
  const [showLangMenu, setShowLangMenu] = useState(false)

  const sidebarWidth = sidebarCollapsed ? '64px' : '240px'

  return (
    <header
      className={cn(
        'fixed top-0 right-0 z-20 flex items-center justify-between px-6',
        'border-b transition-all duration-300'
      )}
      style={{
        left:        sidebarWidth,
        height:      'var(--topbar-height)',
        background:  'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      {/* ── Left: Page context / breadcrumb slot ── */}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-forest-500 animate-pulse-dot" />
          <span className="text-xs font-mono text-[color:var(--text-tertiary)] uppercase tracking-wider">
            Système en ligne
          </span>
        </div>
      </div>

      {/* ── Right: actions ── */}
      <div className="flex items-center gap-1">

        {/* Language switcher */}
        <div className="relative">
          <button
            onClick={() => setShowLangMenu(m => !m)}
            className="btn btn-ghost px-2.5 py-2 text-sm gap-1.5"
            aria-label="Change language"
          >
            <Globe size={15} />
            <span className="font-mono text-xs uppercase">{language}</span>
          </button>

          {showLangMenu && (
            <div
              className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden shadow-lg border animate-slide-down z-50"
              style={{
                background:   'var(--bg-surface)',
                borderColor:  'var(--border-subtle)',
                minWidth:     '100px',
              }}
            >
              {(['fr', 'en'] as const).map(lang => (
                <button
                  key={lang}
                  onClick={() => { setLanguage(lang); setShowLangMenu(false) }}
                  className={cn(
                    'w-full text-left px-4 py-2.5 text-sm font-medium transition-colors',
                    'hover:bg-[color:var(--bg-surface-2)]',
                    language === lang
                      ? 'text-[color:var(--accent-green)] font-600'
                      : 'text-[color:var(--text-primary)]'
                  )}
                >
                  {lang === 'fr' ? '🇫🇷 Français' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dark mode toggle */}
        <button
          onClick={() => setDarkMode(d => !d)}
          className="btn btn-ghost px-2.5 py-2"
          aria-label="Toggle dark mode"
        >
          {darkMode
            ? <Sun  size={15} />
            : <Moon size={15} />
          }
        </button>

        {/* Notifications bell */}
        <button
          className="btn btn-ghost px-2.5 py-2 relative"
          aria-label="Notifications"
        >
          <Bell size={15} />
          {unacknowledgedCount > 0 && (
            <span
              className={cn(
                'absolute top-1 right-1 min-w-[16px] h-4 px-1',
                'flex items-center justify-center',
                'rounded-full text-[10px] font-700 text-white',
                'animate-fade-in'
              )}
              style={{ background: 'var(--status-error)' }}
            >
              {unacknowledgedCount > 9 ? '9+' : unacknowledgedCount}
            </span>
          )}
        </button>

        {/* Divider */}
        <div
          className="w-px h-5 mx-1"
          style={{ background: 'var(--border-subtle)' }}
        />

        {/* User chip + logout */}
        <div className="flex items-center gap-2">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-[color:var(--text-primary)] leading-none">
              {user?.username}
            </p>
            <p className="text-xs text-[color:var(--text-tertiary)] capitalize mt-0.5">
              {user?.role}
            </p>
          </div>

          <button
            onClick={logout}
            className="btn btn-ghost px-2.5 py-2 text-[color:var(--text-tertiary)] hover:text-red-500"
            title="Se déconnecter"
            aria-label="Logout"
          >
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </header>
  )
}
