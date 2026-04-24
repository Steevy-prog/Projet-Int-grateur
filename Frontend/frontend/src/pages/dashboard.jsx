import { useEffect, useState, useCallback, useMemo } from 'react';
import { Thermometer, Droplets, Wind, Sun, Waves, AlertTriangle, Power, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../components/common/card';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useWebSocket } from '../hooks/useWebSocket';
import * as sensorsApi   from '../services/sensors';
import * as alertsApi    from '../services/alerts';
import * as actuatorsApi from '../services/actuators';

// ─── sensor metadata (static) ────────────────────────────────────────────────
const SENSOR_META = {
  temperature: { label: 'Température',  unit: '°C',  icon: Thermometer, color: '#ef4444', gradientId: 'gTemp',  key: 'temperature' },
  humidity:    { label: 'Humidité Air', unit: '%',   icon: Droplets,    color: '#3b82f6', gradientId: 'gHum',   key: 'humidity'    },
  co2:         { label: 'CO₂',          unit: 'ppm', icon: Wind,        color: '#10b981', gradientId: 'gCO2',   key: 'co2'         },
  luminosity:  { label: 'Luminosité',   unit: 'lx',  icon: Sun,         color: '#f59e0b', gradientId: 'gLight', key: 'luminosity'  },
  water_level: { label: 'Niveau Eau',   unit: '%',   icon: Waves,       color: '#06b6d4', gradientId: 'gWater', key: 'water_level' },
};

const STATUS_STYLES = {
  optimal: 'bg-emerald-50 text-emerald-700',
  normal:  'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
  critical:'bg-red-50 text-red-700',
};

const ALERT_STYLES = {
  high:   { bar: 'bg-red-500',   bg: 'bg-red-50 border-red-100',    txt: 'text-red-800',   sub: 'text-red-600'   },
  medium: { bar: 'bg-amber-500', bg: 'bg-amber-50 border-amber-100', txt: 'text-amber-800', sub: 'text-amber-600' },
  low:    { bar: 'bg-blue-500',  bg: 'bg-blue-50 border-blue-100',   txt: 'text-blue-800',  sub: 'text-blue-600'  },
};

function getSensorStatus(type, value) {
  const v = parseFloat(value);
  if (isNaN(v)) return { status: 'normal', label: 'Normal' };
  const rules = {
    temperature: [{ max: 30, s: 'optimal', l: 'Optimal' }, { max: 35, s: 'warning', l: 'Élevé'   }, { s: 'critical', l: 'Critique' }],
    humidity:    [{ max: 80, s: 'optimal', l: 'Optimal' }, { max: 90, s: 'warning', l: 'Élevé'   }, { s: 'critical', l: 'Critique' }],
    co2:         [{ max: 1000, s: 'optimal', l: 'Optimal' }, { max: 1500, s: 'warning', l: 'Élevé' }, { s: 'critical', l: 'Critique' }],
    luminosity:  [{ max: 50000, s: 'normal', l: 'Normal' }, { s: 'warning', l: 'Intense' }],
    water_level: [{ min: 30, s: 'optimal', l: 'Optimal' }, { s: 'warning', l: 'Bas' }],
  };
  if (type === 'water_level') return v >= 30 ? { status: 'optimal', label: 'Optimal' } : { status: 'warning', label: 'Bas' };
  const r = rules[type];
  if (!r) return { status: 'normal', label: 'Normal' };
  for (const rule of r) {
    if (rule.max === undefined || v <= rule.max) return { status: rule.s, label: rule.l };
  }
  return { status: 'normal', label: 'Normal' };
}

const TrendIcon = ({ trend }) => {
  if (trend === 'up')   return <TrendingUp   size={12} className="text-rose-500"    />;
  if (trend === 'down') return <TrendingDown  size={12} className="text-emerald-500" />;
  return                       <Minus         size={12} className="text-slate-400"   />;
};

function SensorCard({ sensor, history }) {
  const meta = SENSOR_META[sensor.type] || {};
  const { status, label: statusLabel } = getSensorStatus(sensor.type, sensor.latest_value);
  const { icon: Icon, color, gradientId, key, label, unit } = meta;

  const miniData = useMemo(() => (history || []).slice(-12).map((r, i) => ({ i, [key]: parseFloat(r.value) })), [history, key]);

  const value = sensor.latest_value != null ? parseFloat(sensor.latest_value).toLocaleString('fr-FR') : '—';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: (color || '#888') + '18' }}>
            {Icon && <Icon size={15} style={{ color }} />}
          </div>
          <span className="text-xs font-semibold text-slate-500">{label || sensor.name}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
          {statusLabel}
        </span>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          <span className="text-sm text-slate-400 ml-1">{unit || sensor.unit}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <TrendIcon trend="stable" />
          <span>—</span>
        </div>
      </div>
      {miniData.length > 0 && (
        <div className="h-12 mt-3 -mx-1">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={miniData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={color} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey={key} stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function formatTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  const diff = Math.floor((Date.now() - d) / 1000);
  if (diff < 60)   return `Il y a ${diff}s`;
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  return `Il y a ${Math.floor(diff / 3600)}h`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const toast     = useToast();

  const [sensors,   setSensors]   = useState([]);
  const [histories, setHistories] = useState({});
  const [alerts,    setAlerts]    = useState([]);
  const [actuators, setActuators] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { if (!user) navigate('/'); }, [user]);

  const load = useCallback(async () => {
    try {
      const [sData, aData, actData] = await Promise.all([
        sensorsApi.list(),
        alertsApi.list({ acknowledged: false }),
        actuatorsApi.list(),
      ]);
      setSensors(sData);
      setAlerts(aData);
      setActuators(actData);

      const now   = new Date();
      const from  = new Date(now - 24 * 3600 * 1000).toISOString();
      const hists = {};
      await Promise.all(
        sData.map(async (s) => {
          try {
            hists[s.id] = await sensorsApi.readings(s.id, { from });
          } catch { hists[s.id] = []; }
        })
      );
      setHistories(hists);
    } catch (err) {
      toast.error(err.message || 'Impossible de charger le tableau de bord.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Real-time WebSocket updates
  useWebSocket((event) => {
    if (event.type === 'sensor.reading') {
      setSensors(prev => prev.map(s =>
        s.id === event.sensor_id ? { ...s, latest_value: event.value, latest_read_at: event.measured_at } : s
      ));
      setHistories(prev => {
        const curr = prev[event.sensor_id] || [];
        return {
          ...prev,
          [event.sensor_id]: [...curr.slice(-499), { value: event.value, measured_at: event.measured_at }],
        };
      });
    }
    if (event.type === 'alert.new') {
      setAlerts(prev => [
        { id: event.alert_id, type: event.alert_type, severity: event.severity,
          message: event.message, sensor_name: event.sensor_name,
          actuator_name: event.actuator_name, triggered_at: event.triggered_at,
          is_acknowledged: false },
        ...prev,
      ]);
    }
    if (event.type === 'actuator.updated') {
      setActuators(prev => prev.map(a =>
        a.id === event.actuator_id
          ? { ...a, status: event.status, last_triggered_at: event.last_triggered_at }
          : a
      ));
    }
  });

  // Build chart data from histories (merge all sensors onto a time axis)
  const chartData = useMemo(() => {
    const allReadings = [];
    Object.entries(histories).forEach(([sensorId, rList]) => {
      const sensor = sensors.find(s => s.id === sensorId);
      if (!sensor) return;
      (rList || []).forEach(r => {
        allReadings.push({ sensorType: sensor.type, value: parseFloat(r.value), time: r.measured_at });
      });
    });
    // Group by hour bucket
    const buckets = {};
    allReadings.forEach(({ sensorType, value, time }) => {
      const h = new Date(time).getHours();
      const key = `${h}h`;
      if (!buckets[key]) buckets[key] = { time: key };
      buckets[key][sensorType] = value;
    });
    return Object.values(buckets).sort((a, b) => parseInt(a.time) - parseInt(b.time));
  }, [histories, sensors]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Tableau de bord</h2>
        <p className="text-sm text-slate-400 mt-0.5">Aperçu en temps réel de la serre</p>
      </div>

      {/* Sensor KPI cards */}
      {sensors.length === 0 ? (
        <p className="text-sm text-slate-400">Aucun capteur configuré.</p>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {sensors.map(s => (
            <SensorCard key={s.id} sensor={s} history={histories[s.id]} />
          ))}
        </div>
      )}

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Température & Humidité (24h)">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="dTemp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="dHum" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={5} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={28} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="temperature" name="Temp (°C)"   stroke="#ef4444" fill="url(#dTemp)" strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="humidity"    name="Humidité (%)" stroke="#3b82f6" fill="url(#dHum)"  strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-red-400" />Température</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-blue-400" />Humidité</div>
            </div>
          </Card>

          <Card title="CO₂ & Luminosité (24h)">
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="dCO2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#10b981" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}    />
                    </linearGradient>
                    <linearGradient id="dLight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.12} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={5} />
                  <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={40} />
                  <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="co2"        name="CO₂ (ppm)"   stroke="#10b981" fill="url(#dCO2)"   strokeWidth={2} dot={false} />
                  <Area type="monotone" dataKey="luminosity" name="Lumière (lx)" stroke="#f59e0b" fill="url(#dLight)" strokeWidth={2} dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-400" />CO₂</div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-amber-400" />Luminosité</div>
            </div>
          </Card>
        </div>
      )}

      {/* Alerts + Actuators */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          title="Alertes Actives"
          icon={AlertTriangle}
          className="lg:col-span-2"
          action={
            alerts.length > 0 && (
              <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
                {alerts.length} active{alerts.length > 1 ? 's' : ''}
              </span>
            )
          }
        >
          {alerts.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Aucune alerte active</p>
          ) : (
            <div className="space-y-2">
              {alerts.slice(0, 5).map(alert => {
                const s = ALERT_STYLES[alert.severity] || ALERT_STYLES.info;
                return (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 border rounded-lg ${s.bg}`}>
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${s.bar}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${s.txt}`}>{alert.message}</p>
                      <p className={`text-xs mt-0.5 ${s.sub}`}>{alert.sensor_name || alert.actuator_name || ''}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{formatTime(alert.triggered_at)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="État des Actionneurs" icon={Power}>
          {actuators.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">Aucun actionneur</p>
          ) : (
            <div className="space-y-3">
              {actuators.map(a => (
                <div key={a.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-700">{a.name}</p>
                    <p className="text-[10px] text-slate-400">{a.type}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    a.status === 'on' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <span className={`h-1.5 w-1.5 rounded-full ${a.status === 'on' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
