import React from "react";
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

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors mb-1 ${
      active 
      ? 'bg-emerald-50 text-emerald-700 font-medium' 
      : 'text-slate-500 hover:bg-slate-100'
    }`}
  >
    <Icon size={20} />
    <span className="text-sm">{label}</span>
  </button>
);

export default function Sidebar() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  

  return (
    <aside className="w-64 border-r border-slate-200 bg-white sticky top-0 h-screen hidden md:flex flex-col p-4">
        <div className="flex items-center gap-3 px-2 mb-10">
          <div className="bg-emerald-600 p-2 rounded-lg text-white">
            <CloudSun size={20} />
          </div>
          <span className="font-bold text-lg tracking-tight">AgriSmart</span>
        </div>

        <nav className="flex-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Menu Principal</p>
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Tableau de bord" 
            active={currentPage === 'dashboard'} 
            onClick={() => setCurrentPage('dashboard')}
          />
          <SidebarItem 
            icon={Activity} 
            label="Surveillance" 
            active={currentPage === 'monitoring'} 
            onClick={() => setCurrentPage('monitoring')}
          />
          <SidebarItem 
            icon={Settings2} 
            label="Contrôle & Seuils" 
            active={currentPage === 'control'} 
            onClick={() => setCurrentPage('control')}
          />
          <SidebarItem 
            icon={Bell} 
            label="Historique Alertes" 
            active={currentPage === 'alerts'} 
            onClick={() => setCurrentPage('alerts')}
          />
          
          <div className="mt-8">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-4 mb-2">Système</p>
            <SidebarItem 
              icon={Users} 
              label="Utilisateurs" 
              active={currentPage === 'admin'} 
              onClick={() => setCurrentPage('admin')}
            />
            <SidebarItem 
              icon={Terminal} 
              label="Logs Script" 
              active={currentPage === 'logs'} 
              onClick={() => setCurrentPage('logs')}
            />
          </div>
        </nav>

        <button 
          onClick={() => setIsLoggedIn(false)}
          className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:text-red-600 transition-colors mt-auto border-t border-slate-100"
        >
          <LogOut size={20} />
          <span className="text-sm">Déconnexion</span>
        </button>
      </aside>
  )
}