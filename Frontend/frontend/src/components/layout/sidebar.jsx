import { LayoutDashboard, Activity, Settings2, Bell, Users, Terminal, LogOut, Leaf, Clock } from 'lucide-react';
import { useApp  } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const NAV_MAIN = [
  { icon: LayoutDashboard, label: 'Tableau de bord',    page: 'dashboard'  },
  { icon: Activity,        label: 'Surveillance',       page: 'monitoring' },
  { icon: Settings2,       label: 'Contrôle & Seuils',  page: 'control'    },
  { icon: Bell,            label: 'Alertes',            page: 'alerts'     },
  { icon: Clock,           label: 'Historique',         page: 'history'    },
];

const NAV_ADMIN = [
  { icon: Users,    label: 'Utilisateurs', page: 'admin' },
  { icon: Terminal, label: 'Logs Système', page: 'logs'  },
];

const SidebarItem = ({ icon: Icon, label, active, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-0.5 text-left ${
      active
        ? 'bg-emerald-50 text-emerald-700 font-semibold border-l-2 border-emerald-600 pl-[10px]'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`}
  >
    <Icon size={17} className="shrink-0" />
    <span className="text-sm">{label}</span>
  </button>
);

export default function Sidebar() {
  const navigate = useNavigate();
  const { currentPage, setCurrentPage } = useApp();
  const { user, logout } = useAuth();

  const go = (page) => {
    setCurrentPage(page);
    navigate(`/${page}`);
  };

  return (
    <aside className="w-60 border-r border-slate-200 bg-white sticky top-0 h-screen hidden md:flex flex-col p-4 shrink-0">

      {/* Brand */}
      <div className="flex items-center gap-2.5 px-1 mb-8">
        <div className="bg-emerald-600 p-1.5 rounded-lg text-white shrink-0">
          <Leaf size={18} />
        </div>
        <div>
          <span className="font-bold text-slate-800 tracking-tight">AgriSmart</span>
          <p className="text-[10px] text-slate-400 leading-none mt-0.5">Serre Intelligente</p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
          Navigation
        </p>
        {NAV_MAIN.map(item => (
          <SidebarItem
            key={item.page}
            icon={item.icon}
            label={item.label}
            active={currentPage === item.page}
            onClick={() => go(item.page)}
          />
        ))}

        {user?.role === 'admin' && (
          <div className="mt-6">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 mb-2">
              Administration
            </p>
            {NAV_ADMIN.map(item => (
              <SidebarItem
                key={item.page}
                icon={item.icon}
                label={item.label}
                active={currentPage === item.page}
                onClick={() => go(item.page)}
              />
            ))}
          </div>
        )}
      </nav>

      {/* User + Logout */}
      <div className="border-t border-slate-100 pt-4 mt-4">
        <div className="flex items-center gap-2.5 px-3 mb-3">
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
            {user?.username
              ? user.username.split('_').map(w => w[0].toUpperCase()).join('').slice(0, 2)
              : 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-700 truncate">
              {user?.username || 'Utilisateur'}
            </p>
            <p className="text-[10px] text-slate-400 capitalize">{user?.role || '—'}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={logout}
          className="w-full flex items-center gap-3 px-3 py-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
        >
          <LogOut size={16} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
