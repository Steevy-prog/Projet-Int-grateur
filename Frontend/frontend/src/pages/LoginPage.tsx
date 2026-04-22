import { useState, FormEvent } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Sprout, Loader2, Lock, User } from 'lucide-react'
import { cn } from '@/lib/utils'

/* ── Types ────────────────────────────────────────────────── */
interface LoginForm {
  username: string
  password: string
}

interface FormErrors {
  username?: string
  password?: string
  general?:  string
}

/* ── Component ────────────────────────────────────────────── */
export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const from     = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard'

  const [form, setForm]           = useState<LoginForm>({ username: '', password: '' })
  const [errors, setErrors]       = useState<FormErrors>({})
  const [showPassword, setShowPw] = useState(false)
  const [loading, setLoading]     = useState(false)

  /* ── Validation ── */
  function validate(): boolean {
    const e: FormErrors = {}
    if (!form.username.trim())       e.username = 'Nom d\'utilisateur requis'
    if (form.password.length < 6)    e.password = 'Mot de passe trop court'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  /* ── Submit ── */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!validate()) return

    setLoading(true)
    setErrors({})

    try {
      // TODO: replace with real API call
      // const res = await fetch('/api/auth/login', {
      //   method:  'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body:    JSON.stringify(form),
      // })
      // if (!res.ok) throw new Error('Identifiants incorrects')
      // const { accessToken } = await res.json()
      // storeToken(accessToken)

      await new Promise(r => setTimeout(r, 1200)) // Simulated delay
      navigate(from, { replace: true })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Identifiants incorrects'
      setErrors({ general: message })
    } finally {
      setLoading(false)
    }
  }

  /* ── Render ── */
  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex lg:w-[52%] relative overflow-hidden flex-col justify-between p-12"
        style={{ background: 'var(--bg-sidebar)' }}
      >
        {/* Background texture */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `
              radial-gradient(ellipse at 20% 50%, rgba(150,192,152,0.4) 0%, transparent 60%),
              radial-gradient(ellipse at 80% 20%, rgba(67,127,70,0.3) 0%, transparent 50%)
            `,
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 rounded-xl bg-forest-500 flex items-center justify-center">
            <Sprout size={20} className="text-white" />
          </div>
          <div>
            <p className="font-display font-800 text-white text-xl leading-none">
              AgriSmart
            </p>
            <p className="text-white/40 text-xs font-mono uppercase tracking-widest mt-0.5">
              UCAC-ICAM · 2025
            </p>
          </div>
        </div>

        {/* Center content */}
        <div className="relative space-y-8 animate-fade-in stagger-2">
          {/* Big headline */}
          <div>
            <h1 className="font-display text-5xl font-800 text-white leading-[1.1] tracking-tight text-balance">
              Gérez vos cultures{' '}
              <span className="text-forest-300">intelligemment</span>
            </h1>
            <p className="mt-4 text-white/55 text-lg leading-relaxed max-w-sm">
              Surveillance en temps réel, automatisation des actions et
              alertes instantanées pour vos exploitations agricoles.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {[
              '🌱 Capteurs IoT',
              '💧 Irrigation auto',
              '🌡️ Température',
              '💨 Ventilation',
              '☀️ Luminosité',
              '📊 Historique',
            ].map(tag => (
              <span
                key={tag}
                className="px-3 py-1.5 rounded-full text-xs font-medium text-white/70 border border-white/10"
                style={{ background: 'rgba(255,255,255,0.06)' }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative grid grid-cols-3 gap-4 animate-fade-in stagger-4">
          {[
            { value: '5',    label: 'Capteurs actifs' },
            { value: '3',    label: 'Actionneurs'     },
            { value: '24/7', label: 'Surveillance'    },
          ].map(stat => (
            <div
              key={stat.label}
              className="p-4 rounded-2xl border border-white/10"
              style={{ background: 'rgba(255,255,255,0.05)' }}
            >
              <p className="font-display font-800 text-2xl text-white">
                {stat.value}
              </p>
              <p className="text-white/45 text-xs mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-[400px] animate-fade-in stagger-1">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-forest-600 flex items-center justify-center">
              <Sprout size={16} className="text-white" />
            </div>
            <p className="font-display font-700 text-lg text-[color:var(--text-primary)]">
              AgriSmart
            </p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-display text-3xl font-800 tracking-tight text-[color:var(--text-primary)]">
              Connexion
            </h2>
            <p className="mt-2 text-sm text-[color:var(--text-secondary)]">
              Accédez à votre tableau de bord agricole
            </p>
          </div>

          {/* General error */}
          {errors.general && (
            <div
              className="mb-5 flex items-center gap-2.5 px-4 py-3 rounded-xl border text-sm animate-slide-down"
              style={{
                background:   '#fef2f2',
                borderColor:  '#fecaca',
                color:        '#dc2626',
              }}
            >
              <span className="text-base">⚠</span>
              {errors.general}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* Username */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="username"
                className="text-sm font-medium text-[color:var(--text-primary)]"
              >
                Nom d'utilisateur
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-tertiary)]">
                  <User size={15} />
                </span>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  autoFocus
                  placeholder="ex: admin_user"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className={cn(
                    'input-base pl-10',
                    errors.username && 'border-red-400 focus:border-red-500'
                  )}
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <p className="text-xs text-red-600">⚠ {errors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="password"
                className="text-sm font-medium text-[color:var(--text-primary)]"
              >
                Mot de passe
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-tertiary)]">
                  <Lock size={15} />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={cn(
                    'input-base pl-10 pr-11',
                    errors.password && 'border-red-400 focus:border-red-500'
                  )}
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)] transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Masquer' : 'Afficher'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-600">⚠ {errors.password}</p>
              )}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'btn btn-primary w-full mt-2 py-3 text-base',
                'shadow-glow-green transition-all duration-200',
                loading && 'opacity-80'
              )}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Connexion en cours…
                </>
              ) : (
                'Se connecter'
              )}
            </button>
          </form>

          {/* Admin note */}
          <div
            className="mt-6 flex items-start gap-2.5 p-3.5 rounded-xl border text-xs"
            style={{
              background:  'var(--bg-surface-2)',
              borderColor: 'var(--border-subtle)',
              color:       'var(--text-tertiary)',
            }}
          >
            <Lock size={13} className="mt-0.5 flex-shrink-0" />
            <p>
              Les comptes sont créés par un administrateur.
              Contactez votre administrateur si vous n'avez pas encore accès.
            </p>
          </div>

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-[color:var(--text-tertiary)]">
            © 2025 UCAC-ICAM · Agriculture Intelligente
          </p>
        </div>
      </div>
    </div>
  )
}
