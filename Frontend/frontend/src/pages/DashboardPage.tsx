import { useState, useEffect } from 'react'
import {
  RefreshCw, Download, Wifi, WifiOff,
  Droplets, Thermometer, Wind, Sun, Waves,
} from 'lucide-react'
import PageWrapper          from '@/components/layout/PageWrapper'
// import Card                 from '@/components/ui/Card'
import { Badge, Button, Tabs }    from '@/components/ui'
import {
  SensorCard, AlertItem,
  ActuatorToggle, ChartWrapper,
} from '@/components/data'
import { useAuth }          from '@/hooks'
import { formatTimeAgo }    from '@/lib/utils'
import type {
  Sensor, Actuator, Alert,
  SensorReading, Threshold,
} from '@/types'
import { cn } from '@/lib/utils'

/* ══════════════════════════════════════════════════════════
   MOCK DATA — replace with real API calls + WebSocket
══════════════════════════════════════════════════════════ */
const MOCK_SENSORS: Sensor[] = [
  { id: 's1', name: 'Humidité Sol',     type: 'humidity',    unit: '%',   location: 'Parcelle A', is_active: true,  created_at: '', status: 'online',  latestValue: 24.0  },
  { id: 's2', name: 'Température',      type: 'temperature', unit: '°C',  location: 'Serre 1',    is_active: true,  created_at: '', status: 'online',  latestValue: 37.2  },
  { id: 's3', name: 'Taux CO₂',         type: 'co2',         unit: 'ppm', location: 'Serre 1',    is_active: true,  created_at: '', status: 'online',  latestValue: 850.0 },
  { id: 's4', name: 'Luminosité',       type: 'luminosity',  unit: 'lux', location: 'Parcelle A', is_active: true,  created_at: '', status: 'online',  latestValue: 100.0 },
  { id: 's5', name: 'Niveau Réservoir', type: 'water_level', unit: '%',   location: 'Réservoir',  is_active: false, created_at: '', status: 'offline', latestValue: 10.0  },
]

const MOCK_ACTUATORS: Actuator[] = [
  { id: 'a1', name: 'Pompe Irrigation',  type: 'pump',        status: 'off', last_triggered_at: new Date(Date.now() - 3 * 3600000).toISOString(), created_at: '' },
  { id: 'a2', name: 'Ventilateur Serre', type: 'ventilation', status: 'on',  last_triggered_at: new Date(Date.now() - 3600000).toISOString(),     created_at: '' },
  { id: 'a3', name: 'Éclairage Serre',   type: 'lighting',    status: 'off', last_triggered_at: new Date(Date.now() - 1200000).toISOString(),     created_at: '' },
]

const MOCK_ALERTS: Alert[] = [
  { id: 'al1', sensor_id: 's1', actuator_id: 'a1', type: 'low_humidity',    message: 'Humidité du sol à 24% — en dessous du seuil de 30%. Irrigation recommandée.',          severity: 'high',   is_acknowledged: false, acknowledged_by: null, triggered_at: new Date(Date.now() - 1800000).toISOString(), acknowledged_at: null, sensor_name: 'Humidité Sol',     actuator_name: 'Pompe Irrigation'  },
  { id: 'al2', sensor_id: 's2', actuator_id: 'a2', type: 'high_temperature', message: 'Température à 37.2°C — dépasse le seuil de 35°C. Ventilation déclenchée.',             severity: 'high',   is_acknowledged: false, acknowledged_by: null, triggered_at: new Date(Date.now() - 1800000).toISOString(), acknowledged_at: null, sensor_name: 'Température',      actuator_name: 'Ventilateur Serre' },
  { id: 'al3', sensor_id: 's4', actuator_id: 'a3', type: 'low_luminosity',   message: 'Luminosité à 100 lux — en dessous du seuil de 200 lux. Éclairage recommandé.',         severity: 'medium', is_acknowledged: false, acknowledged_by: null, triggered_at: new Date(Date.now() - 1200000).toISOString(), acknowledged_at: null, sensor_name: 'Luminosité',       actuator_name: 'Éclairage Serre'   },
  { id: 'al4', sensor_id: 's5', actuator_id: null,  type: 'low_water_level',  message: 'Niveau du réservoir à 10% — seuil critique atteint. Remplissage requis immédiatement.', severity: 'high',   is_acknowledged: false, acknowledged_by: null, triggered_at: new Date(Date.now() - 600000).toISOString(),  acknowledged_at: null, sensor_name: 'Niveau Réservoir', actuator_name: undefined           },
]

/* Spark data generator */
function genSpark(base: number, count = 12, spread = 8): { t: string; v: number }[] {
  return Array.from({ length: count }, (_, i) => ({
    t: `${count - i}m`,
    v: Math.max(0, base + (Math.random() - 0.5) * spread),
  })).reverse()
}

/* Chart history data */
function genHistory(base: number, hours = 24, spread = 10) {
  return Array.from({ length: hours }, (_, i) => ({
    time:  `${String(i).padStart(2, '0')}:00`,
    value: Math.max(0, base + (Math.random() - 0.5) * spread),
  }))
}

const THRESHOLDS: Record<string, { min: number | null; max: number | null }> = {
  humidity:    { min: 30,   max: 80   },
  temperature: { min: 15,   max: 35   },
  co2:         { min: null, max: 1000 },
  luminosity:  { min: 200,  max: null },
  water_level: { min: 20,   max: null },
}

function getSensorCardStatus(
  type: string, value: number | undefined
): 'normal' | 'warning' | 'critical' | 'offline' {
  if (value === undefined) return 'offline'
  const t = THRESHOLDS[type]
  if (!t) return 'normal'
  if (t.min !== null && value < t.min) return 'critical'
  if (t.max !== null && value > t.max) return 'critical'
  if (t.min !== null && value < t.min * 1.1) return 'warning'
  if (t.max !== null && value > t.max * 0.9) return 'warning'
  return 'normal'
}

const SENSOR_COLORS: Record<string, string> = {
  humidity:    '#437f46',
  temperature: '#d97706',
  co2:         '#6366f1',
  luminosity:  '#ca8a04',
  water_level: '#0284c7',
}

const CHART_TABS = [
  { key: '1h',  label: '1h'  },
  { key: '6h',  label: '6h'  },
  { key: '24h', label: '24h' },
]

/* ══════════════════════════════════════════════════════════
   COMPONENT
══════════════════════════════════════════════════════════ */
export default function DashboardPage() {
  const { user }                              = useAuth()
  const isAdmin                               = user?.role === 'admin'
  const [alerts, setAlerts]                   = useState<Alert[]>(MOCK_ALERTS)
  const [actuators, setActuators]             = useState<Actuator[]>(MOCK_ACTUATORS)
  const [selectedSensor, setSelectedSensor]   = useState<string>('s1')
  const [chartTab, setChartTab]               = useState('24h')
  const [lastRefresh, setLastRefresh]         = useState(new Date())
  const [refreshing, setRefreshing]           = useState(false)
  const [ackLoading, setAckLoading]           = useState<string | null>(null)
  const [actuatorLoading, setActuatorLoading] = useState<string | null>(null)

  const activeSensor   = MOCK_SENSORS.find(s => s.id === selectedSensor)
  const onlineSensors  = MOCK_SENSORS.filter(s => s.status === 'online').length
  const activeAlerts   = alerts.filter(a => !a.is_acknowledged)

  /* ── Simulate auto refresh every 30s ── */
  useEffect(() => {
    const interval = setInterval(() => setLastRefresh(new Date()), 30000)
    return () => clearInterval(interval)
  }, [])

  /* ── Manual refresh ── */
  async function handleRefresh() {
    setRefreshing(true)
    await new Promise(r => setTimeout(r, 800))
    setLastRefresh(new Date())
    setRefreshing(false)
  }

  /* ── Acknowledge alert ── */
  async function handleAcknowledge(id: string) {
    setAckLoading(id)
    await new Promise(r => setTimeout(r, 600))
    setAlerts(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, is_acknowledged: true, acknowledged_at: new Date().toISOString() }
          : a
      )
    )
    setAckLoading(null)
  }

  /* ── Toggle actuator ── */
  async function handleActuatorToggle(id: string, newStatus: 'on' | 'off') {
    setActuatorLoading(id)
    await new Promise(r => setTimeout(r, 700))
    setActuators(prev =>
      prev.map(a =>
        a.id === id
          ? { ...a, status: newStatus, last_triggered_at: new Date().toISOString() }
          : a
      )
    )
    setActuatorLoading(null)
  }

  /* ── Chart data based on selected sensor + tab ── */
  const chartHours  = chartTab === '1h' ? 1 : chartTab === '6h' ? 6 : 24
  const chartPoints = chartTab === '1h' ? 12 : chartTab === '6h' ? 24 : 48
  const chartData   = genHistory(activeSensor?.latestValue ?? 50, chartPoints, 10)

  return (
    <PageWrapper>
      <div className="space-y-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-2xl font-800 tracking-tight text-[color:var(--text-primary)]">
              Tableau de bord
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="status-dot online animate-pulse-dot" />
              <span className="text-xs text-[color:var(--text-tertiary)] font-mono">
                Actualisé {formatTimeAgo(lastRefresh)}
              </span>
              <span className="text-[color:var(--border-default)]">·</span>
              <span className="text-xs text-[color:var(--text-tertiary)]">
                {onlineSensors}/{MOCK_SENSORS.length} capteurs en ligne
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeAlerts.length > 0 && (
              <Badge variant="danger" dot>
                {activeAlerts.length} alerte{activeAlerts.length > 1 ? 's' : ''} active{activeAlerts.length > 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={13} className={cn(refreshing && 'animate-spin')} />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              Actualiser
            </Button>
          </div>
        </div>

        {/* ── System status bar ── */}
        <div
          className="flex items-center gap-3 px-4 py-3 rounded-xl border flex-wrap"
          style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}
        >
          <span className="text-xs font-medium text-[color:var(--text-secondary)] uppercase tracking-wide">
            État capteurs
          </span>
          <div className="flex items-center gap-2 flex-wrap">
            {MOCK_SENSORS.map(s => (
              <button
                key={s.id}
                onClick={() => setSelectedSensor(s.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  selectedSensor === s.id
                    ? 'bg-forest-50 text-forest-700 border border-forest-200'
                    : 'hover:bg-[color:var(--bg-surface-2)] text-[color:var(--text-secondary)]'
                )}
              >
                <div className={cn('status-dot', s.status === 'online' ? 'online' : 'offline')} />
                {s.name}
              </button>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-[color:var(--text-tertiary)]">
            {onlineSensors === MOCK_SENSORS.length
              ? <><Wifi size={12} className="text-green-500" /> Tous en ligne</>
              : <><WifiOff size={12} className="text-red-400" /> {MOCK_SENSORS.length - onlineSensors} hors ligne</>
            }
          </div>
        </div>

        {/* ── Sensor cards grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {MOCK_SENSORS.map((sensor, i) => (
            <div
              key={sensor.id}
              className={cn(`stagger-${Math.min(i + 1, 6)} animate-fade-in opacity-0-init`)}
              onClick={() => setSelectedSensor(sensor.id)}
            >
              <SensorCard
                type={sensor.type}
                value={sensor.is_active ? (sensor.latestValue ?? null) : null}
                unit={sensor.unit}
                status={
                  !sensor.is_active
                    ? 'offline'
                    : getSensorCardStatus(sensor.type, sensor.latestValue)
                }
                location={sensor.location}
                trend={
                  sensor.type === 'humidity'    ? 'down'   :
                  sensor.type === 'temperature' ? 'up'     :
                  sensor.type === 'co2'         ? 'down'   :
                  sensor.type === 'luminosity'  ? 'down'   : 'stable'
                }
                sparkData={
                  sensor.is_active
                    ? genSpark(sensor.latestValue ?? 50)
                    : undefined
                }
                className={cn(
                  'cursor-pointer transition-all',
                  selectedSensor === sensor.id && 'ring-2 ring-forest-400 ring-offset-2'
                )}
              />
            </div>
          ))}
        </div>

        {/* ── Main content: chart + alerts + actuators ── */}

      </div>
    </PageWrapper>
  )
}