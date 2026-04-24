import { useEffect } from 'react';
import { Download, Thermometer, Droplets, Wind, Sun, Waves } from 'lucide-react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import Card from '../components/common/card';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const CHART_DATA = Array.from({ length: 24 }, (_, i) => ({
  time:     `${i}h`,
  temp:     +(22 + Math.sin(i / 4) * 3 + Math.random() * 0.3).toFixed(1),
  humidity: +(55 + Math.cos(i / 3) * 8 + Math.random() * 0.5).toFixed(1),
  water:    +(42 + Math.sin(i / 6) * 4 + Math.random() * 0.3).toFixed(1),
}));

const SENSORS = [
  { name: 'Température',  model: 'DHT22',   value: '24.5 °C',  status: 'active',   icon: Thermometer, color: '#ef4444', lastLog: 'Il y a 2 min'  },
  { name: 'Humidité Air', model: 'DHT22',   value: '58 %',     status: 'active',   icon: Droplets,    color: '#3b82f6', lastLog: 'Il y a 2 min'  },
  { name: 'CO₂',          model: 'SEN0159', value: '820 ppm',  status: 'active',   icon: Wind,        color: '#10b981', lastLog: 'Il y a 3 min'  },
  { name: 'Luminosité',   model: 'BH1750',  value: '3 200 lx', status: 'active',   icon: Sun,         color: '#f59e0b', lastLog: 'Il y a 4 min'  },
  { name: 'Niveau Eau',   model: 'YL-69',   value: '42 %',     status: 'inactive', icon: Waves,       color: '#06b6d4', lastLog: 'Il y a 12 min' },
];

const TOOLTIP_STYLE = {
  borderRadius: '8px',
  border: '1px solid #e2e8f0',
  fontSize: '12px',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.05)',
};

export default function Monitoring() {
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  const activeSensors   = SENSORS.filter(s => s.status === 'active').length;
  const inactiveSensors = SENSORS.filter(s => s.status === 'inactive').length;

  return (
    <div className="space-y-6">

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Surveillance des Capteurs</h2>
          <p className="text-sm text-slate-400 mt-0.5">Analyses et historique des relevés</p>
        </div>
        <button
          type="button"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm font-medium self-start sm:self-auto"
        >
          <Download size={15} />
          Exporter les données
        </button>
      </div>

      {/* Summary pills */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-slate-600 font-medium">{activeSensors} actif{activeSensors > 1 ? 's' : ''}</span>
        </div>
        {inactiveSensors > 0 && (
          <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            <span className="text-slate-600 font-medium">{inactiveSensors} inactif{inactiveSensors > 1 ? 's' : ''}</span>
          </div>
        )}
        <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm shadow-sm">
          <span className="text-slate-600 font-medium">{SENSORS.length} capteurs total</span>
        </div>
      </div>

      {/* Chart */}
      <Card title="Historique détaillé — 24h">
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={CHART_DATA} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                interval={5}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={32}
              />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
              <Legend
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }}
              />
              <Line type="monotone" dataKey="temp"     name="Temp (°C)"    stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="humidity" name="Humidité (%)" stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="water"    name="Eau (%)"      stroke="#06b6d4" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Sensor table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700 text-sm">État des capteurs</h3>
        </div>
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
            {SENSORS.map(sensor => (
              <tr key={sensor.name} className="hover:bg-slate-50 transition-colors">
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-lg bg-slate-100">
                      <sensor.icon size={14} style={{ color: sensor.color }} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-700">{sensor.name}</p>
                      <p className="text-[11px] text-slate-400 font-mono">{sensor.model}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <span className={`h-1.5 w-1.5 rounded-full ${sensor.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                    <span className={`text-xs font-semibold ${sensor.status === 'active' ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {sensor.status === 'active' ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                </td>
                <td className="px-5 py-3.5 font-semibold text-slate-700">{sensor.value}</td>
                <td className="px-5 py-3.5 text-slate-400 text-xs">{sensor.lastLog}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
