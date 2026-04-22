/* ── useAuth ──────────────────────────────────────────────── */
// Stub — replace with your actual auth context/store
import { useState } from 'react'
import type { User } from '@/types'

export function useAuth() {
  const [user] = useState<User | null>({
    id:         '11111111-1111-1111-1111-111111111111',
    username:   'admin_user',
    email:      'admin@agriculture-intelligente.cm',
    role:       'admin',
    language:   'fr',
    is_active:  true,
    created_at: new Date().toISOString(),
  })

  const [isLoading] = useState(false)

  const logout = () => {
    // Clear tokens, redirect to /login
    window.location.href = '/login'
  }

  return { user, isLoading, logout }
}

/* ── useAlerts ────────────────────────────────────────────── */
// Stub — replace with your actual API + WebSocket integration
export function useAlerts() {
  return {
    unacknowledgedCount: 3,
  }
}

/* ── useTranslation ───────────────────────────────────────── */
// Stub — replace with i18next or your preferred i18n library
import { useState as useStateT } from 'react'
type Language = 'fr' | 'en'

export function useTranslation() {
  const [language, setLanguage] = useStateT<Language>('fr')
  return { language, setLanguage }
}
