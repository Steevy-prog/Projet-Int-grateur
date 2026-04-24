import { useState } from 'react';
import { Bell, Menu, X, LayoutDashboard, Activity, Settings2, Bell as BellIcon, Users, Terminal, Clock } from 'lucide-react';
import { useApp  } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MOCK_NOTIFICATIONS = [
  { id: 1, text: 'Humidité du sol sous le seuil (18%)', time: 'Il y a 2 min', unread: true  },
  { id: 2, text: 'Température dépasse 29 °C',           time: 'Il y a 12 min', unread: true  },
  { id: 3, text: 'Pic de CO₂ détecté (1450 ppm)',       time: 'Il y a 1h',    unread: false },
];

const NAV_LINKS = [
  { icon: LayoutDashboard, label: 'Dashboard',        page: 'dashboard',  adminOnly: false },
  { icon: Activity,        label: 'Surveillance',     page: 'monitoring', adminOnly: false },
  { icon: Settings2,       label: 'Contrôle',         page: 'control',    adminOnly: false },
  { icon: BellIcon,        label: 'Alertes',          page: 'alerts',     adminOnly: false },
  { icon: Clock,           label: 'Historique',       page: 'history',    adminOnly: false },
  { icon: Users,           label: 'Utilisateurs',     page: 'admin',      adminOnly: true  },
  { icon: Terminal,        label: 'Logs Système',     page: 'logs',       adminOnly: true  },
];

export default function Header() {
  const [mobileOpen,     setMobileOpen]     = useState(false);
  const [notifOpen,      setNotifOpen]      = useState(false);
  const { currentPage, setCurrentPage, isLive } = useApp();
  const { user } = useAuth();
  const navigate = useNavigate();

  const unreadCount = MOCK_NOTIFICATIONS.filter(n => n.unread).length;

  const go = (page) => {
    setCurrentPage(page);
    navigate(`/${page}`);
    setMobileOpen(false);
  };

  const initials = user?.username
    ? user.username.split('_').map(w => w[0].toUpperCase()).join('').slice(0, 2)
    : 'U';

  const displayName = user?.username || 'Utilisateur';

  const currentDate = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });

  return (
    <header className="h-14 border-b border-slate-200 bg-white/90 backdrop-blur-md sticky top-0 z-20 flex items-center justify-between px-5 lg:px-8 shrink-0">

      {/* Left — user info */}
      <div className="flex items-center gap-3">
        <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold shrink-0">
          {initials}
        </div>
        <div className="">
          <div>
            <p className="text-xs font-semibold text-slate-800 leading-none">{displayName}</p>
            <p className="text-[10px] text-slate-400 mt-0.5 capitalize">{user?.role || '—'}</p>
          </div>
        </div>
      </div>

      {/* Center — connection status + date */}
      <div className="hidden md:flex items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-600 font-medium">Connecté en direct</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-red-500 font-medium">Déconnecté</span>
            </>
          )}
        </div>
        <span className="text-slate-300">|</span>
        <span>{currentDate}</span>
      </div>

      {/* Center — connection status + date  for mobile*/}
      <div className="flex md:hidden items-center gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          {isLive ? (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-emerald-600 font-medium">En direct</span>
            </>
          ) : (
            <>
              <span className="h-2 w-2 rounded-full bg-red-500" />
              <span className="text-red-500 font-medium">Déconnecté</span>
            </>
          )}
        </div>
      </div>

      {/* Right — notifications + mobile menu */}
      <div className="flex items-center gap-2">

        {/* Notification bell */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setNotifOpen(v => !v)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors"
          >
            <Bell size={17} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
                {unreadCount}
              </span>
            )}
          </button>

          {notifOpen && (
            <div className="absolute right-0 top-10 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-30 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
                <span className="text-sm font-semibold text-slate-700">Notifications</span>
                <button
                  type="button"
                  onClick={() => setNotifOpen(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X size={14} />
                </button>
              </div>
              {MOCK_NOTIFICATIONS.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 last:border-0 ${n.unread ? 'bg-emerald-50/40' : ''}`}
                >
                  <span className={`mt-1.5 h-2 w-2 rounded-full shrink-0 ${n.unread ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <div>
                    <p className="text-xs text-slate-700 leading-snug">{n.text}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{n.time}</p>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => { go('alerts'); setNotifOpen(false); }}
                className="w-full text-center text-xs text-emerald-600 font-medium py-3 hover:bg-slate-50 transition-colors"
              >
                Voir toutes les alertes →
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu toggle */}
        <button
          type="button"
          onClick={() => setMobileOpen(v => !v)}
          className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white border-b border-slate-200 shadow-lg z-30 px-4 py-3 flex flex-col gap-1">
          {NAV_LINKS.map(link => {
            if (link.adminOnly && user?.role !== 'admin') return null;
            return (
              <button
                key={link.page}
                type="button"
                onClick={() => go(link.page)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  currentPage === link.page
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                <link.icon size={16} />
                {link.label}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
}
