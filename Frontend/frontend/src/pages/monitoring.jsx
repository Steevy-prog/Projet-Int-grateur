import {React, useState, useEffect} from 'react';
import { 
  LayoutDashboard, 
  Activity, 
  Settings2, 
  Bell, 
  Users, 
  Terminal, 
  LogOut, 
  Droplets, 
  Thermometer, 
  CloudSun, 
  Power,
  ChevronRight,
  AlertTriangle,
  Download,
  Plus,
  Trash2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

import Card from '../components/common/card';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';



const MOCK_SENSOR_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  temp: 22 + Math.random() * 5,
  humidity: 45 + Math.random() * 15,
  moisture: 30 + Math.random() * 10
}));

// return (
  
// )

export default function Monitoring() {
  const navigate = useNavigate();


  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user]);

  return (
    <div className="space-y-6">
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-bold text-slate-800">Analyses des Capteurs</h2>
      <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm text-sm">
        <Download size={16} /> Exporter les données
      </button>
    </div>
    
    <Card title="Historique Détaillé">
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={MOCK_SENSOR_DATA}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="time" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="temp" stroke="#ef4444" strokeWidth={2} dot={false} name="Temp (°C)" />
            <Line type="monotone" dataKey="humidity" stroke="#3b82f6" strokeWidth={2} dot={false} name="Humidité (%)" />
            <Line type="monotone" dataKey="moisture" stroke="#10b981" strokeWidth={2} dot={false} name="Sol (%)" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>

    <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left text-sm">
        <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
          <tr>
            <th className="px-6 py-3">Capteur</th>
            <th className="px-6 py-3">Statut</th>
            <th className="px-6 py-3">Dernière Mesure</th>
            <th className="px-6 py-3">Dernier Log</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {[1, 2, 3].map(i => (
            <tr key={i} className="hover:bg-slate-50">
              <td className="px-6 py-4 font-medium text-slate-700">Capteur #{i}</td>
              <td className="px-6 py-4">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">ACTIF</span>
              </td>
              <td className="px-6 py-4 text-slate-500">{(Math.random() * 50).toFixed(1)} units</td>
              <td className="px-6 py-4 text-slate-400">Il y a 5 min</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
  )
};
