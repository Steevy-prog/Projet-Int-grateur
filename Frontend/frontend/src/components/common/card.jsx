import React from 'react';
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


const Card = ({ children, title, icon: Icon }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-slate-700">{title}</h3>
      {Icon && <Icon className="text-emerald-600 size-5" />}
    </div>
    {children}
  </div>
);


export default Card;