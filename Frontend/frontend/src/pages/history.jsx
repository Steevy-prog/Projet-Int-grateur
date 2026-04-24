import { useState, useEffect, useCallback } from 'react';
import { Download, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import * as sensorsApi from '../services/sensors';
import * as actionsApi from '../services/actions';
import * as exportsApi from '../services/exports';

const TABS = [
  { id: 'actions',  label: 'Actions Actionneurs', icon: Zap      },
  { id: 'readings', label: 'Relevés Capteurs',    icon: Activity },
];

const SENSOR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];

const ACTION_TYPE_LABELS = {
  turn_on:  'Activation',
  turn_off: 'Désactivation',
};

const SOURCE_LABELS = {
  web:  { label: 'Web',  cls: 'bg-blue-100 text-blue-700'   },
  cli:  { label: 'CLI',  cls: 'bg-purple-100 text-purple-700' },
  auto: { label: 'Auto', cls: 'bg-amber-100 text-amber-700'  },
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function History() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const toast     = useToast();
  const [activeTab, setActiveTab] = useState('actions');

  const [actions,   setActions]   = useState([]);
  const [sensors,   setSensors]   = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => { if (!user) navigate('/'); }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [actionData, sData] = await Promise.all([
        actionsApi.list(),
        sensorsApi.list(),
      ]);
      setActions(actionData);
      setSensors(sData);

      // Fetch 24h readings for all sensors
      const now  = new Date();
      const from = new Date(now - 24 * 3600 * 1000).toISOString();
      const allReadings = await Promise.all(
        sData.map(async s => {
          try {
            const r = await sensorsApi.readings(s.id, { from });
            return { type: s.type, name: s.name, readings: r };
          } catch { return { type: s.type, name: s.name, readings: [] }; }
        })
      );
      const buckets = {};
      allReadings.forEach(({ type, readings }) => {
        readings.forEach(r => {
          const h   = new Date(r.measured_at).getHours();
          const key = `${String(h).padStart(2, '0')}:00`;
          if (!buckets[key]) buckets[key] = { time: key };
          buckets[key][type] = parseFloat(r.value);
        });
      });
      setChartData(Object.values(buckets).sort((a, b) => a.time.localeCompare(b.time)));
    } catch (err) {
      toast.error(err.message || 'Impossible de charger l\'historique.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExport = async () => {
    setExporting(true);
    try {
      if (activeTab === 'actions') {
        await exportsApi.generate('actions', {}, 'historique_actions.csv');
      } else {
        await exportsApi.generate('sensor_readings', {}, 'historique_releves.csv');
      }
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'export.');
    } finally {
      setExporting(false);
    }
  };

  const sensorTypes = [...new Set(sensors.map(s => s.type))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Historique & Exports</h2>
        <button type="button" onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium disabled:opacity-60">
          {exporting
            ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : <Download size={16} />
          }
          Exporter CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {TABS.map(tab => (
          <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {activeTab === 'actions' && (
            <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
                  <tr>
                    <th className="px-6 py-3">Actionneur</th>
                    <th className="px-6 py-3">Action</th>
                    <th className="px-6 py-3">Source</th>
                    <th className="px-6 py-3">Déclenché par</th>
                    <th className="px-6 py-3">Notes</th>
                    <th className="px-6 py-3">Horodatage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {actions.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                        Aucune action enregistrée
                      </td>
                    </tr>
                  ) : actions.map(a => {
                    const src = SOURCE_LABELS[a.source] || { label: a.source, cls: 'bg-slate-100 text-slate-600' };
                    return (
                      <tr key={a.id} className="hover:bg-slate-50">
                        <td className="px-6 py-4">
                          <p className="font-semibold text-slate-700 text-xs">{a.actuator_name}</p>
                          <p className="text-[10px] text-slate-400">{a.actuator_type}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            a.action_type === 'turn_on'
                              ? 'bg-emerald-100 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {ACTION_TYPE_LABELS[a.action_type] || a.action_type}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${src.cls}`}>
                            {src.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs font-mono">
                          {a.triggered_by_username || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs max-w-[140px] truncate">
                          {a.notes || '—'}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(a.triggered_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'readings' && (
            <Card title="Relevés des 24 dernières heures">
              {chartData.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">Aucun relevé disponible pour les dernières 24h.</p>
              ) : (
                <div className="h-80 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                      {sensorTypes.map((type, i) => (
                        <Line key={type} type="monotone" dataKey={type}
                          name={sensors.find(s => s.type === type)?.name || type}
                          stroke={SENSOR_COLORS[i % SENSOR_COLORS.length]}
                          strokeWidth={2} dot={false} />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          )}
        </>
      )}
    </div>
  );
}
