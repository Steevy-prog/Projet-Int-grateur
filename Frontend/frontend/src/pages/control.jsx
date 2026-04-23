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
import { useAuth } from '../context/AuthContext';

import Card from '../components/common/card';
import { useNavigate } from 'react-router-dom';



const MOCK_SENSOR_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  temp: 22 + Math.random() * 5,
  humidity: 45 + Math.random() * 15,
  moisture: 30 + Math.random() * 10
}));


const Control= () => {
  const navigate = useNavigate();

  const { user } = useAuth();
  
    useEffect(() => {
      if (!user) {
        navigate('/');
      }
    }, [user]);

  const [actuators, setActuators] = useState([
    { id: 1, name: 'Pompe à Eau A', type: 'Irrigation', status: 'OFF' },
    { id: 2, name: 'Ventilateur Nord', type: 'Ventilation', status: 'ON' },
    { id: 3, name: 'Éclairage Serre', type: 'Lumière', status: 'OFF' },
  ]);

  const toggleStatus = (id) => {
    setActuators(prev => prev.map(a => 
      a.id === id ? { ...a, status: a.status === 'ON' ? 'OFF' : 'ON' } : a
    ));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <h2 className="text-xl font-bold text-slate-800">Override Manuel</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {actuators.map(a => (
            <div key={a.id} className="p-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between">
              <div>
                <p className="font-semibold text-slate-800">{a.name}</p>
                <p className="text-xs text-slate-500">{a.type}</p>
              </div>
              <button 
                onClick={() => toggleStatus(a.id)}
                className={`p-3 rounded-full transition-all ${
                  a.status === 'ON' 
                  ? 'bg-emerald-600 text-white ring-4 ring-emerald-50' 
                  : 'bg-slate-100 text-slate-400'
                }`}
              >
                <Power size={20} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800">Seuils d'Automatisation</h2>
        <Card title="Gestion des Seuils" icon={Settings2}>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Température Max (°C)</label>
              <input type="number" defaultValue="30" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 block mb-1">Humidité Sol Min (%)</label>
              <input type="number" defaultValue="25" className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <button className="w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors">
              Mettre à jour
            </button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Control;