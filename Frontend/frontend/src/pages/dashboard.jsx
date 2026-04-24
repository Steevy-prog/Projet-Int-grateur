import { useEffect, useMemo } from 'react';
import { Thermometer, Droplets, Wind, Sun, Waves, AlertTriangle, Power, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import Card from '../components/common/card';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CHART_DATA = Array.from({ length: 24 }, (_, i) => ({
  time:     `${i}h`,
  temp:     +(22 + Math.sin(i / 4) * 3.5 + Math.random() * 0.5).toFixed(1),
  humidity: +(55 + Math.cos(i / 3) * 8   + Math.random() * 1  ).toFixed(1),
  co2:      +(820 + Math.sin(i / 5) * 150 + Math.random() * 20 ).toFixed(0),
  light:    +(3200 + Math.cos(i / 4) * 800 + Math.random() * 100).toFixed(0),
  water:    +(42  + Math.sin(i / 6) * 5   + Math.random() * 1  ).toFixed(1),
}));

const SENSORS = [
  {
    key: 'temp', label: 'Température', value: '24.5', unit: '°C',
    icon: Thermometer, color: '#ef4444', gradientId: 'gTemp',
    status: 'normal', statusLabel: 'Normal', trend: 'up', trendLabel: '+0.3°',
  },
  {
    key: 'humidity', label: 'Humidité Air', value: '58', unit: '%',
    icon: Droplets, color: '#3b82f6', gradientId: 'gHum',
    status: 'optimal', statusLabel: 'Optimal', trend: 'stable', trendLabel: '—',
  },
  {
    key: 'co2', label: 'CO₂', value: '820', unit: 'ppm',
    icon: Wind, color: '#10b981', gradientId: 'gCO2',
    status: 'normal', statusLabel: 'Normal', trend: 'down', trendLabel: '-30 ppm',
  },
  {
    key: 'light', label: 'Luminosité', value: '3 200', unit: 'lx',
    icon: Sun, color: '#f59e0b', gradientId: 'gLight',
    status: 'optimal', statusLabel: 'Optimal', trend: 'up', trendLabel: '+120 lx',
  },
  {
    key: 'water', label: 'Niveau Eau', value: '42', unit: '%',
    icon: Waves, color: '#06b6d4', gradientId: 'gWater',
    status: 'warning', statusLabel: 'Bas', trend: 'down', trendLabel: '-5%',
  },
];

const STATUS_STYLES = {
  optimal: 'bg-emerald-50 text-emerald-700',
  normal:  'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
  critical:'bg-red-50 text-red-700',
};

const TrendIcon = ({ trend }) => {
  if (trend === 'up')     return <TrendingUp   size={12} className="text-rose-500"    />;
  if (trend === 'down')   return <TrendingDown  size={12} className="text-emerald-500" />;
  return                         <Minus         size={12} className="text-slate-400"   />;
};

function SensorCard({ sensor }) {
  const { label, value, unit, icon: Icon, color, gradientId, status, statusLabel, trend, trendLabel, key } = sensor;

  const miniData = useMemo(
    () => CHART_DATA.slice(-12),
    []
  );

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: color + '18' }}>
            <Icon size={15} style={{ color }} />
          </div>
          <span className="text-xs font-semibold text-slate-500">{label}</span>
        </div>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLES[status]}`}>
          {statusLabel}
        </span>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <span className="text-2xl font-bold text-slate-800">{value}</span>
          <span className="text-sm text-slate-400 ml-1">{unit}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-500">
          <TrendIcon trend={trend} />
          <span>{trendLabel}</span>
        </div>
      </div>

      <div className="h-12 mt-3 -mx-1">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={miniData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                <stop offset="95%" stopColor={color} stopOpacity={0}    />
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey={key} stroke={color} strokeWidth={1.5}
              fill={`url(#${gradientId})`} dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const ACTIVE_ALERTS = [
  { id: 1, severity: 'critical', text: 'Niveau d\'eau bas — Secteur A',  detail: 'Seuil min. 20% atteint', time: 'Il y a 2 min' },
  { id: 2, severity: 'warning',  text: 'Température élevée — Serre 1',  detail: '28.5 °C à 14:20',        time: 'Il y a 32 min' },
];

const ALERT_STYLES = {
  critical: { bar: 'bg-red-500',   bg: 'bg-red-50 border-red-100',  txt: 'text-red-800',  sub: 'text-red-600'  },
  warning:  { bar: 'bg-amber-500', bg: 'bg-amber-50 border-amber-100', txt: 'text-amber-800', sub: 'text-amber-600' },
};

const ACTUATORS = [
  { name: 'Pompe Irrigation A', type: 'Irrigation', status: 'ON'  },
  { name: 'Ventilateur',        type: 'Ventilation', status: 'OFF' },
  { name: 'Éclairage LED',      type: 'Lumière',     status: 'OFF' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  return (
    <div className="space-y-6">

      {/* Page title */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Tableau de bord</h2>
        <p className="text-sm text-slate-400 mt-0.5">Aperçu en temps réel de la serre</p>
      </div>

      {/* Sensor KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {SENSORS.map(s => <SensorCard key={s.key} sensor={s} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Température & Humidité (24h)">
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={CHART_DATA}>
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
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                <Area type="monotone" dataKey="temp"     name="Temp (°C)"  stroke="#ef4444" fill="url(#dTemp)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="humidity" name="Humidité (%)" stroke="#3b82f6" fill="url(#dHum)"  strokeWidth={2} dot={false} />
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
              <AreaChart data={CHART_DATA}>
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
                <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)' }} />
                <Area type="monotone" dataKey="co2"   name="CO₂ (ppm)"  stroke="#10b981" fill="url(#dCO2)"   strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="light" name="Lumière (lx)" stroke="#f59e0b" fill="url(#dLight)" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-400" />CO₂</div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-amber-400" />Luminosité</div>
          </div>
        </Card>
      </div>

      {/* Alerts + Actuator status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        <Card
          title="Alertes Actives"
          icon={AlertTriangle}
          className="lg:col-span-2"
          action={
            <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">
              {ACTIVE_ALERTS.length} active{ACTIVE_ALERTS.length > 1 ? 's' : ''}
            </span>
          }
        >
          {ACTIVE_ALERTS.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">Aucune alerte active</p>
          ) : (
            <div className="space-y-2">
              {ACTIVE_ALERTS.map(alert => {
                const s = ALERT_STYLES[alert.severity];
                return (
                  <div key={alert.id} className={`flex items-start gap-3 p-3 border rounded-lg ${s.bg}`}>
                    <div className={`w-1 self-stretch rounded-full shrink-0 ${s.bar}`} />
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${s.txt}`}>{alert.text}</p>
                      <p className={`text-xs mt-0.5 ${s.sub}`}>{alert.detail}</p>
                    </div>
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">{alert.time}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card title="État des Actionneurs" icon={Power}>
          <div className="space-y-3">
            {ACTUATORS.map(a => (
              <div key={a.name} className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-700">{a.name}</p>
                  <p className="text-[10px] text-slate-400">{a.type}</p>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  a.status === 'ON' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                }`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${a.status === 'ON' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </Card>

      </div>
    </div>
  );
}
