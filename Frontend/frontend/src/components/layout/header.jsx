import { useState } from 'react';
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
  Menu
} from 'lucide-react';
import { useApp } from "../../context/AppContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";


export default function Header() {

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { currentPage, setCurrentPage, isLive } = useApp();
  const { user } = useAuth();

  const navigate = useNavigate();

  const currentDate = new Date().toLocaleDateString('en-GB');

  const navlinks = [
    { icon: LayoutDashboard, label: 'Dashboard', page: 'dashboard', foradmin: false },
    { icon: Activity, label: 'Surveillance', page: 'monitoring', foradmin: false },
    { icon: Settings2, label: 'Contrôle & Seuils', page: 'control', foradmin: false },
    { icon: Bell, label: 'Historique Alertes', page: 'alerts', foradmin: false },
    { icon: Users, label: 'Utilisateurs', page: 'admin', foradmin: true },
    { icon: Terminal, label: 'Logs Système', page: 'logs', foradmin: true },
  ];

  return (
    <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
      <div className="flex items-center gap-4">
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
            AJ
          </div>
          <div className=" text-left">
            <p className="text-xs font-bold text-slate-800">Admin Jean</p>
            <p className="hidden md:block text-[10px] text-slate-500">Dernière connexion: 15:30</p>
            <div className="md:hidden flex items-center gap-1.5">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
            </span>
            <span className="font-[400] text-[12px] text-[#00D100] tracking-tight">
              Live 
            </span>
          </div>
          </div>
      </div>
      {/* <div className="flex items-center gap-2 text-sm text-slate-500">
        
      </div> */}
      <div className="hidden md:flex">
        {isLive ? 
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-2 pr-2 border-r border-black">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
            </span>
            <span className="font-[400] text-[#00D100] tracking-tight">
              Live Connection
            </span>
          </div>
          <div className="tracking-tight">
            {currentDate}
          </div>
        </div>
        :
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <div className="flex items-center gap-2 pr-2 border-r-2 border-black">
            <span className="h-2 w-2 rounded-full bg-red-500"></span>
            <span className="font-[400] text-red-500 tracking-tight">
              Disconnected
            </span>
          </div>
          <div className="tracking-tight">
            {currentDate}
          </div>
        </div>
      }
      </div>
      <div className="md:hidden">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="p-2 rounded-md hover:bg-slate-100"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
      {
        isMenuOpen && (
          <div className="absolute top-12 right-4 w-52 bg-white border border-slate-200 rounded-lg shadow-lg p-4 flex flex-col gap-3">
            {navlinks.map(link => {
              if (link.foradmin && user?.role !== 'admin') return null;
              return (
                <button
                  key={link.page}
                  onClick={() => {
                    setIsMenuOpen(false);
                    setCurrentPage(link.page);
                    navigate(`/${link.page}`);
                  }}
                  className={`flex items-center gap-3 px-4 py-2 rounded-md hover:bg-slate-100 ${
                    currentPage === link.page ? 'bg-emerald-100 text-emerald-700' : 'text-slate-500'
                  }`}
                >
                  <link.icon size={16} />
                  <span className="text-sm">{link.label}</span>
                </button>
              );
            })}
          </div>
        )
      }
    </header>
  )
}