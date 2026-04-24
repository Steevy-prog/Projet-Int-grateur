import { useState, useEffect } from 'react';
import { Download, Zap, Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/card';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

const MOCK_ACTIONS = [
  { id: 1, actuator: 'Pompe Irrigation A', action_type: 'activate',   source: 'script', triggered_by: 'admin_jean',   executed_at: '2026-04-24 15:40' },
  { id: 2, actuator: 'Ventilateur',        action_type: 'activate',   source: 'script', triggered_by: 'system',        executed_at: '2026-04-24 15:38' },
  { id: 3, actuator: 'Éclairage LED',      action_type: 'deactivate', source: 'api',    triggered_by: 'operator_marc', executed_at: '2026-04-24 14:50' },
  { id: 4, actuator: 'Pompe Irrigation A', action_type: 'deactivate', source: 'api',    triggered_by: 'admin_jean',    executed_at: '2026-04-24 14:10' },
  { id: 5, actuator: 'Ventilateur',        action_type: 'deactivate', source: 'script', triggered_by: 'system',        executed_at: '2026-04-24 13:45' },
];

const MOCK_READINGS = Array.from({ length: 24 }, (_, i) => ({
  time:        `${i}:00`,
  temperature: +(22 + Math.sin(i / 4) * 3).toFixed(1),
  humidity:    +(55 + Math.cos(i / 3) * 8).toFixed(1),
  co2:         +(800 + Math.sin(i / 5) * 150).toFixed(0),
}));

const TABS = [
  { id: 'actions',  label: 'Actions Actionneurs', icon: Zap },
  { id: 'readings', label: 'Relevés Capteurs',    icon: Activity },
];

export default function History() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('actions');

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Historique & Exports</h2>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium"
        >
          <Download size={16} /> Exporter CSV
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-emerald-700 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'actions' && (
        <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3">Actionneur</th>
                <th className="px-6 py-3">Action</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Déclenché par</th>
                <th className="px-6 py-3">Horodatage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MOCK_ACTIONS.map(action => (
                <tr key={action.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-700">{action.actuator}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      action.action_type === 'activate'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}>
                      {action.action_type === 'activate' ? 'ACTIVÉ' : 'DÉSACTIVÉ'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      action.source === 'script' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {action.source.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs">{action.triggered_by}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs">{action.executed_at}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'readings' && (
        <Card title="Relevés des 24 dernières heures">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={MOCK_READINGS}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line type="monotone" dataKey="temperature" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp (°C)" />
                <Line type="monotone" dataKey="humidity"    stroke="#3b82f6" strokeWidth={2} dot={false} name="Humidité (%)" />
                <Line type="monotone" dataKey="co2"         stroke="#8b5cf6" strokeWidth={2} dot={false} name="CO₂ (ppm)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}
    </div>
  );
}
