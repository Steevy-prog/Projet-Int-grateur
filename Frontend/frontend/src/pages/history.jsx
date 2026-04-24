import { useState, useEffect, useCallback } from 'react';
import { Download, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import * as sensorsApi from '../services/sensors';

// Actuator actions come from the backend via the actuators app.
// The API for action history: GET /api/actuators/ returns actuators but no action list endpoint.
// We use script-logs as the proxy for actuator commands history.
import * as logsApi from '../services/logs';

const TABS = [
  { id: 'actions',  label: 'Actions Actionneurs', icon: Zap      },
  { id: 'readings', label: 'Relevés Capteurs',    icon: Activity },
];

const SENSOR_COLORS = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#06b6d4'];

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function History() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const [activeTab, setActiveTab] = useState('actions');

  const [logs,      setLogs]      = useState([]);
  const [sensors,   setSensors]   = useState([]);
  const [chartData, setChartData] = useState([]);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => { if (!user) navigate('/'); }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [logData, sData] = await Promise.all([
        logsApi.list(),
        sensorsApi.list(),
      ]);
      setLogs(logData);
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
          const h = new Date(r.measured_at).getHours();
          const key = `${String(h).padStart(2, '0')}:00`;
          if (!buckets[key]) buckets[key] = { time: key };
          buckets[key][type] = parseFloat(r.value);
        });
      });
      setChartData(Object.values(buckets).sort((a, b) => a.time.localeCompare(b.time)));
    } catch { /* show empty state */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleExport = () => {
    if (!chartData.length) return;
    const headers = Object.keys(chartData[0]).join(',');
    const rows    = chartData.map(row => Object.values(row).join(','));
    const csv     = [headers, ...rows].join('\n');
    const blob    = new Blob([csv], { type: 'text/csv' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url; a.download = 'historique_releves.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const sensorTypes = [...new Set(sensors.map(s => s.type))];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Historique & Exports</h2>
        <button type="button" onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium">
          <Download size={16} /> Exporter CSV
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
                    <th className="px-6 py-3">Commande</th>
                    <th className="px-6 py-3">Résultat</th>
                    <th className="px-6 py-3">Source</th>
                    <th className="px-6 py-3">Déclenché par</th>
                    <th className="px-6 py-3">Horodatage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">Aucune action enregistrée</td>
                    </tr>
                  ) : logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-700">{log.command}</div>
                        {log.script_name && (
                          <div className="font-mono text-[10px] text-slate-400 mt-0.5">{log.script_name}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.result === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.result === 'success' ? 'SUCCÈS' : 'ÉCHEC'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.source === 'script' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {(log.source || '').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-500 text-xs font-mono">{log.executed_by || '—'}</td>
                      <td className="px-6 py-4 text-slate-400 text-xs">{formatDate(log.executed_at)}</td>
                    </tr>
                  ))}
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
