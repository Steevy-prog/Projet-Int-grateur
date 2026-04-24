import { useEffect, useState, useCallback } from 'react';
import { Download, Thermometer, Droplets, Wind, Sun, Waves } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Card from '../components/common/card';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useWebSocket } from '../hooks/useWebSocket';
import * as sensorsApi from '../services/sensors';
import * as exportsApi from '../services/exports';

const SENSOR_META = {
  temperature: { icon: Thermometer, color: '#ef4444', model: 'DHT22'   },
  humidity:    { icon: Droplets,    color: '#3b82f6', model: 'DHT22'   },
  co2:         { icon: Wind,        color: '#10b981', model: 'SEN0159' },
  luminosity:  { icon: Sun,         color: '#f59e0b', model: 'BH1750'  },
  water_level: { icon: Waves,       color: '#06b6d4', model: 'YL-69'   },
};

const CHART_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
};

function formatLastSeen(iso) {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `Il y a ${diff}s`;
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  return `Il y a ${Math.floor(diff / 3600)}h`;
}

function formatValue(value, unit) {
  if (value == null) return '—';
  return `${parseFloat(value).toLocaleString('fr-FR')} ${unit || ''}`.trim();
}

export default function Monitoring() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const toast     = useToast();

  const [sensors,   setSensors]  = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading,   setLoading]  = useState(true);

  useEffect(() => { if (!user) navigate('/'); }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sData = await sensorsApi.list();
      setSensors(sData);

      const now  = new Date();
      const from = new Date(now - 24 * 3600 * 1000).toISOString();
      const allReadings = await Promise.all(
        sData.map(async s => {
          try {
            const r = await sensorsApi.readings(s.id, { from });
            return { type: s.type, readings: r };
          } catch { return { type: s.type, readings: [] }; }
        })
      );

      const buckets = {};
      allReadings.forEach(({ type, readings }) => {
        readings.forEach(r => {
          const h = new Date(r.measured_at).getHours();
          const key = `${h}h`;
          if (!buckets[key]) buckets[key] = { time: key };
          buckets[key][type] = parseFloat(r.value);
        });
      });
      setChartData(Object.values(buckets).sort((a, b) => parseInt(a.time) - parseInt(b.time)));
    } catch (err) {
      toast.error(err.message || 'Impossible de charger les capteurs.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useWebSocket((event) => {
    if (event.type === 'sensor.reading') {
      setSensors(prev => prev.map(s =>
        s.id === event.sensor_id
          ? { ...s, latest_value: event.value, latest_read_at: event.measured_at }
          : s
      ));
    }
    if (event.type === 'sensor.status') {
      setSensors(prev => prev.map(s =>
        s.id === event.sensor_id ? { ...s, last_status: event.status } : s
      ));
    }
  });

  const activeSensors   = sensors.filter(s => s.is_active).length;
  const inactiveSensors = sensors.filter(s => !s.is_active).length;

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportsApi.generate('sensor_readings', {}, 'releves_capteurs.csv');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'export.');
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const sensorTypes = [...new Set(sensors.map(s => s.type))];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Surveillance des Capteurs</h2>
          <p className="text-sm text-slate-400 mt-0.5">Analyses et historique des relevés</p>
        </div>
        <button type="button" onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium self-start sm:self-auto disabled:opacity-60">
          {exporting
            ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Download size={15} />
          }
          Exporter les données
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-slate-600 font-medium">{activeSensors} actif{activeSensors !== 1 ? 's' : ''}</span>
        </div>
        {inactiveSensors > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-slate-600 font-medium">{inactiveSensors} inactif{inactiveSensors !== 1 ? 's' : ''}</span>
          </div>
        )}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm">
          <span className="text-slate-600 font-medium">{sensors.length} capteurs total</span>
        </div>
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card title="Historique détaillé — 24h">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} interval={5} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false} width={32} />
                <Tooltip contentStyle={TOOLTIP_STYLE} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                {sensorTypes.map((type, i) => (
                  <Line key={type} type="monotone" dataKey={type}
                    name={SENSOR_META[type]?.label || type}
                    stroke={SENSOR_META[type]?.color || CHART_COLORS[i % CHART_COLORS.length]}
                    strokeWidth={2} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Sensor table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700 text-sm">État des capteurs</h3>
        </div>
        {sensors.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">Aucun capteur configuré.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Capteur</th>
                <th className="px-5 py-3">Statut</th>
                <th className="px-5 py-3">Dernière mesure</th>
                <th className="px-5 py-3">Dernier relevé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sensors.map(sensor => {
                const meta = SENSOR_META[sensor.type] || {};
                const Icon = meta.icon;
                return (
                  <tr key={sensor.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-slate-100">
                          {Icon && <Icon size={14} style={{ color: meta.color }} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-700">{sensor.name}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{meta.model || sensor.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${sensor.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span className={`text-xs font-semibold ${sensor.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {sensor.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700">
                      {formatValue(sensor.latest_value, sensor.unit)}
                    </td>
                    <td className="px-5 py-3.5 text-slate-400 text-xs">{formatLastSeen(sensor.latest_read_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
