import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface AuthGuardProps {
  requireAdmin?: boolean
}

/**
 * Protects routes:
 * - Unauthenticated users → redirected to /login
 * - Viewers accessing admin-only routes → redirected to /dashboard
 */
export default function AuthGuard({ requireAdmin = false }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const location = useLocation()

  // While checking auth state, render nothing (or a spinner)
  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent-green)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm font-mono text-[color:var(--text-tertiary)]">
            Chargement...
          </p>
        </div>
      </div>
    )
  }

  // Not logged in → go to login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Viewer trying to access admin-only page → go to dashboard
  if (requireAdmin && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return <Outlet />
}
