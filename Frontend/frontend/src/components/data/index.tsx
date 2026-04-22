import {
  Droplets, Thermometer, Wind, Sun, Waves,
  TrendingUp, TrendingDown, Minus,
  AlertTriangle, CheckCircle2, Info,
  ToggleLeft, ToggleRight,
  Loader2,
} from 'lucide-react'
import {
  LineChart, Line, ResponsiveContainer, Tooltip, YAxis,
} from 'recharts'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui'
import type { SensorType, ActuatorType, AlertSeverity } from '@/types'

/* ══════════════════════════════════════════════════════════
   SENSOR CARD
══════════════════════════════════════════════════════════ */
const sensorMeta: Record<SensorType, {
  icon:  React.ReactNode
  label: string
  color: string
  bg:    string
}> = {
  humidity:    { icon: <Droplets    size={18} />, label: 'Humidité Sol',       color: '#437f46', bg: '#f0f7f0' },
  temperature: { icon: <Thermometer size={18} />, label: 'Température',        color: '#d97706', bg: '#fffbeb' },
  co2:         { icon: <Wind        size={18} />, label: 'Taux CO₂',           color: '#6366f1', bg: '#eef2ff' },
  luminosity:  { icon: <Sun         size={18} />, label: 'Luminosité',         color: '#ca8a04', bg: '#fefce8' },
  water_level: { icon: <Waves       size={18} />, label: 'Niveau Réservoir',   color: '#0284c7', bg: '#f0f9ff' },
}

interface SparkPoint { t: string; v: number }

interface SensorCardProps {
  type:       SensorType
  value:      number | null
  unit:       string
  status:     'normal' | 'warning' | 'critical' | 'offline'
  location?:  string
  trend?:     'up' | 'down' | 'stable'
  sparkData?: SparkPoint[]
  loading?:   boolean
  className?: string
}

export function SensorCard({
  type, value, unit, status, location,
  trend, sparkData, loading, className,
}: SensorCardProps) {
  const meta = sensorMeta[type]

  const statusConfig = {
    normal:   { label: 'Normal',    badge: 'success' as const, dot: 'online'  },
    warning:  { label: 'Attention', badge: 'warning' as const, dot: 'warning' },
    critical: { label: 'Critique',  badge: 'danger'  as const, dot: 'error'   },
    offline:  { label: 'Hors ligne',badge: 'neutral' as const, dot: 'offline' },
  }[status]

  const TrendIcon = trend === 'up'
    ? TrendingUp
    : trend === 'down'
      ? TrendingDown
      : Minus

  return (
    <div className={cn('card card-hover p-5 flex flex-col gap-4', className)}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: meta.bg, color: meta.color }}
          >
            {meta.icon}
          </div>
          <div>
            <p className="text-xs font-medium text-[color:var(--text-tertiary)] uppercase tracking-wide">
              {meta.label}
            </p>
            {location && (
              <p className="text-xs text-[color:var(--text-tertiary)] mt-0.5">
                📍 {location}
              </p>
            )}
          </div>
        </div>
        <Badge variant={statusConfig.badge} dot>
          {statusConfig.label}
        </Badge>
      </div>

      {/* Value */}
      {loading ? (
        <div className="skeleton h-9 w-28" />
      ) : (
        <div className="flex items-end gap-2">
          <span
            className="font-display font-800 text-3xl tracking-tight leading-none"
            style={{ color: value === null ? 'var(--text-tertiary)' : 'var(--text-primary)' }}
          >
            {value !== null ? value.toFixed(1) : '—'}
          </span>
          <span className="text-sm font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
            {unit}
          </span>
          {trend && (
            <TrendIcon
              size={14}
              className="mb-1.5 ml-1"
              style={{
                color: trend === 'up'
                  ? (type === 'co2' || type === 'temperature' ? '#dc2626' : '#437f46')
                  : trend === 'down'
                    ? (type === 'humidity' || type === 'water_level' ? '#dc2626' : '#437f46')
                    : 'var(--text-tertiary)'
              }}
            />
          )}
        </div>
      )}

      {/* Sparkline */}
      {sparkData && sparkData.length > 0 && (
        <div className="h-12 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={sparkData}>
              <YAxis domain={['auto', 'auto']} hide />
              <Tooltip
                contentStyle={{
                  background:    'var(--bg-surface)',
                  border:        '1px solid var(--border-subtle)',
                  borderRadius:  '8px',
                  fontSize:      '11px',
                  fontFamily:    'DM Sans, sans-serif',
                  boxShadow:     'var(--shadow-card)',
                }}
                formatter={(v: number) => [`${v.toFixed(1)} ${unit}`, '']}
                labelFormatter={() => ''}
              />
              <Line
                type="monotone"
                dataKey="v"
                stroke={meta.color}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3, fill: meta.color }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}


/* ══════════════════════════════════════════════════════════
   ALERT ITEM
══════════════════════════════════════════════════════════ */
const severityConfig: Record<AlertSeverity, {
  icon:  React.ReactNode
  bg:    string
  border:string
  color: string
  label: string
}> = {
  high:   {
    icon:   <AlertTriangle size={15} />,
    bg:     '#fef2f2', border: '#fecaca', color: '#dc2626', label: 'Critique',
  },
  medium: {
    icon:   <AlertTriangle size={15} />,
    bg:     '#fffbeb', border: '#fde68a', color: '#d97706', label: 'Attention',
  },
  low:    {
    icon:   <Info size={15} />,
    bg:     '#f0f9ff', border: '#bae6fd', color: '#0284c7', label: 'Info',
  },
}

interface AlertItemProps {
  id:             string
  type:           string
  message:        string
  severity:       AlertSeverity
  sensorName?:    string
  triggeredAt:    string
  isAdmin:        boolean
  onAcknowledge?: (id: string) => void
  loading?:       boolean
}

export function AlertItem({
  id, message, severity, sensorName, triggeredAt,
  isAdmin, onAcknowledge, loading,
}: AlertItemProps) {
  const cfg = severityConfig[severity]

  return (
    <div
      className="flex items-start gap-3 p-3.5 rounded-xl border transition-all"
      style={{ background: cfg.bg, borderColor: cfg.border }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: 'white', color: cfg.color, border: `1px solid ${cfg.border}` }}
      >
        {cfg.icon}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className="text-xs font-700 uppercase tracking-wide"
            style={{ color: cfg.color }}
          >
            {cfg.label}
          </span>
          {sensorName && (
            <span className="text-xs text-[color:var(--text-tertiary)]">
              · {sensorName}
            </span>
          )}
        </div>
        <p className="text-sm mt-0.5 text-[color:var(--text-primary)] leading-snug">
          {message}
        </p>
        <p className="text-xs text-[color:var(--text-tertiary)] mt-1 font-mono">
          {new Date(triggeredAt).toLocaleString('fr-FR')}
        </p>
      </div>

      {isAdmin && onAcknowledge && (
        <button
          onClick={() => onAcknowledge(id)}
          disabled={loading}
          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-600 transition-colors"
          style={{
            background: 'white',
            color:       cfg.color,
            border:      `1px solid ${cfg.border}`,
          }}
          title="Marquer comme traité"
        >
          {loading
            ? <Loader2 size={11} className="animate-spin" />
            : <CheckCircle2 size={11} />
          }
          <span className="hidden sm:inline">OK</span>
        </button>
      )}
    </div>
  )
}


/* ══════════════════════════════════════════════════════════
   ACTUATOR TOGGLE
══════════════════════════════════════════════════════════ */
const actuatorMeta: Record<ActuatorType, {
  icon:  React.ReactNode
  label: string
}> = {
  pump:        { icon: <Droplets    size={16} />, label: 'Pompe Irrigation' },
  ventilation: { icon: <Wind        size={16} />, label: 'Ventilation'      },
  lighting:    { icon: <Sun         size={16} />, label: 'Éclairage'        },
}

interface ActuatorToggleProps {
  id:           string
  type:         ActuatorType
  name:         string
  status:       'on' | 'off'
  lastTriggered?: string
  isAdmin:      boolean
  onToggle?:    (id: string, newStatus: 'on' | 'off') => void
  loading?:     boolean
}

export function ActuatorToggle({
  id, type, name, status, lastTriggered,
  isAdmin, onToggle, loading,
}: ActuatorToggleProps) {
  const meta   = actuatorMeta[type]
  const isOn   = status === 'on'
  const toggle = () => onToggle?.(id, isOn ? 'off' : 'on')

  return (
    <div
      className={cn(
        'flex items-center justify-between p-4 rounded-xl border transition-all duration-200',
        isOn
          ? 'bg-forest-50 border-forest-200'
          : 'bg-[color:var(--bg-surface)] border-[color:var(--border-subtle)]'
      )}
    >
      {/* Info */}
      <div className="flex items-center gap-3">
        <div
          className={cn(
            'w-9 h-9 rounded-xl flex items-center justify-center transition-colors',
            isOn ? 'bg-forest-500 text-white' : 'bg-[color:var(--bg-surface-2)] text-[color:var(--text-secondary)]'
          )}
        >
          {meta.icon}
        </div>
        <div>
          <p className="text-sm font-600 text-[color:var(--text-primary)]">{name}</p>
          {lastTriggered && (
            <p className="text-xs text-[color:var(--text-tertiary)] mt-0.5 font-mono">
              {new Date(lastTriggered).toLocaleString('fr-FR')}
            </p>
          )}
        </div>
      </div>

      {/* Toggle */}
      <div className="flex items-center gap-2.5">
        <span
          className="text-xs font-700 uppercase tracking-wide"
          style={{ color: isOn ? 'var(--accent-green)' : 'var(--text-tertiary)' }}
        >
          {isOn ? 'ON' : 'OFF'}
        </span>

        {loading ? (
          <Loader2 size={18} className="animate-spin text-[color:var(--text-tertiary)]" />
        ) : isAdmin ? (
          <button
            onClick={toggle}
            className={cn(
              'transition-colors duration-200',
              isOn
                ? 'text-forest-600 hover:text-forest-800'
                : 'text-[color:var(--text-tertiary)] hover:text-[color:var(--text-primary)]'
            )}
            aria-label={isOn ? 'Éteindre' : 'Allumer'}
          >
            {isOn
              ? <ToggleRight size={28} />
              : <ToggleLeft  size={28} />
            }
          </button>
        ) : (
          <div className={cn('status-dot', isOn ? 'online' : 'offline')} />
        )}
      </div>
    </div>
  )
}


/* ══════════════════════════════════════════════════════════
   CHART WRAPPER (Recharts line chart)
══════════════════════════════════════════════════════════ */
import {
  LineChart as ReLineChart,
  CartesianGrid,
  XAxis,
  Legend,
  Area,
  AreaChart,
} from 'recharts'

interface ChartDataPoint {
  time:  string
  value: number
}

interface ChartWrapperProps {
  data:       ChartDataPoint[]
  color?:     string
  unit?:      string
  loading?:   boolean
  height?:    number
  showGrid?:  boolean
  showArea?:  boolean
}

export function ChartWrapper({
  data,
  color    = 'var(--accent-green)',
  unit     = '',
  loading  = false,
  height   = 200,
  showGrid = true,
  showArea = true,
}: ChartWrapperProps) {
  if (loading) {
    return <div className="skeleton w-full" style={{ height }} />
  }

  const Chart = showArea ? AreaChart : ReLineChart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={data}>
        {showGrid && (
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--border-subtle)"
            vertical={false}
          />
        )}
        <XAxis
          dataKey="time"
          tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          tickMargin={8}
        />
        <YAxis
          tick={{ fontSize: 11, fill: 'var(--text-tertiary)', fontFamily: 'JetBrains Mono' }}
          axisLine={false}
          tickLine={false}
          tickMargin={8}
          width={36}
        />
        <Tooltip
          contentStyle={{
            background:   'var(--bg-surface)',
            border:       '1px solid var(--border-subtle)',
            borderRadius: '10px',
            fontSize:     '12px',
            fontFamily:   'DM Sans, sans-serif',
            boxShadow:    'var(--shadow-card)',
            padding:      '8px 12px',
          }}
          formatter={(v: number) => [`${v.toFixed(1)} ${unit}`, 'Valeur']}
          labelStyle={{ color: 'var(--text-secondary)', marginBottom: '4px' }}
          cursor={{ stroke: color, strokeWidth: 1, strokeDasharray: '4 2' }}
        />
        {showArea ? (
          <>
            <defs>
              <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0.01} />
              </linearGradient>
            </defs>
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill="url(#chartGradient)"
              dot={false}
              activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            />
          </>
        ) : (
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
          />
        )}
      </Chart>
    </ResponsiveContainer>
  )
}
