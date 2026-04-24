import { React, useState, useEffect } from 'react';
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
  Clock,
  Wind,
  Spotlight,
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



const SENSOR_CONFIGS = [
  { title: "Température (24h)", key: "temp", color: "#C62121", id: "colorTemp" },
  { title: "Humidité (24h)", key: "moisture", color: "#4E9CE7", id: "colorMoist" },
  { title: "Niveau d'eau (24h)", key: "water", color: "#82C9FF", id: "colorWater" },
  { title: "Luminosité (24h)", key: "light", color: "#EB9B0F", id: "colorLight" },
  { title: "Niveau de CO2 (24h)", key: "co2", color: "#20C933", id: "colorCO2" },
];

const MOCK_SENSOR_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  temp: 22 + Math.random() * 5,
  moisture: 30 + Math.random() * 10,
  water: 30 + Math.random() * 15,
  light: 30 + Math.random() * 20,
  co2: 30 + Math.random() * 22
}));


export default function Dashboard (){
  const navigate = useNavigate();

  const { user } = useAuth();
  
    useEffect(() => {
      if (!user) {
        navigate('/');
      }
    }, [user]);
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        <Card title="Température" icon={Thermometer}>
          <div className="text-3xl font-bold text-slate-800">24.5 °C</div>
          <p className="text-xs text-slate-500 mt-1">Niveau normal</p>
        </Card>
        <Card title="Humidité" icon={CloudSun}>
          <div className="text-3xl font-bold text-slate-800">58 %</div>
          <p className="text-xs text-slate-500 mt-1">Niveau optimal</p>
        </Card>
        <Card title="Niveau d'eau" icon={Droplets}>
          <div className="text-3xl font-bold text-slate-800">32 %</div>
          <p className="text-xs text-orange-500 mt-1">Seuil bas détecté</p>
        </Card>
        <Card title="Luminosité" icon={Spotlight}>
          <div className="text-3xl font-bold text-slate-800">140</div>
          <p className="text-xs text-slate-500 mt-1">Niveau optimal</p>
        </Card>
        <Card title="Niveau de CO2" icon={Wind}>
          <div className="text-3xl font-bold text-slate-800">0.1 %</div>
          <p className="text-xs text-slate-500 mt-1">Niveau optimal</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {SENSOR_CONFIGS.map((sensor) => (
          <Card key={sensor.id} title={sensor.title}>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_SENSOR_DATA}>
                  <defs>
                    <linearGradient id={sensor.id} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={sensor.color} stopOpacity={0.1}/>
                      <stop offset="95%" stopColor={sensor.color} stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="time" hide />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={sensor.key} 
                    stroke={sensor.color} 
                    fillOpacity={1} 
                    fill={`url(#${sensor.id})`} 
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        ))}
      </div>
      <Card title="Alertes Actives" icon={AlertTriangle}>
        <div className="space-y-3">
          <div className="flex gap-3 p-3 bg-red-50 border border-red-100 rounded-lg">
            <AlertTriangle className="text-red-600 size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-800">Sol trop sec - Secteur A</p>
              <p className="text-xs text-red-600">Humidité &lt; 20%</p>
            </div>
          </div>
          <div className="flex gap-3 p-3 bg-amber-50 border border-amber-100 rounded-lg">
            <AlertTriangle className="text-amber-600 size-5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-amber-800">Température élevée - Serre 1</p>
              <p className="text-xs text-amber-600">28.5°C atteint à 14:20</p>
            </div>
          </div>
        </div>
      </Card>

  </div>
  )
};
