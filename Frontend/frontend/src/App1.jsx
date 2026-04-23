import React, { useState, useEffect, useMemo } from 'react';
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

/**
 * MOCK DATA GENERATION
 */
const MOCK_SENSOR_DATA = Array.from({ length: 24 }, (_, i) => ({
  time: `${i}:00`,
  temp: 22 + Math.random() * 5,
  humidity: 45 + Math.random() * 15,
  moisture: 30 + Math.random() * 10
}));

const INITIAL_USERS = [
  { id: 1, username: 'admin_jean', email: 'jean@ferme.ci', role: 'Admin', is_active: true },
  { id: 2, username: 'operator_marc', email: 'marc@ferme.ci', role: 'Operator', is_active: true },
];

/**
 * COMPONENTS
 */

const Card = ({ children, title, icon: Icon }) => (
  <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <h3 className="font-semibold text-slate-700">{title}</h3>
      {Icon && <Icon className="text-emerald-600 size-5" />}
    </div>
    {children}
  </div>
);

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

// --- PAGES ---

const Dashboard = () => (
  <div className="space-y-6 animate-in fade-in duration-500">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Card title="Température" icon={Thermometer}>
        <div className="text-3xl font-bold text-slate-800">24.5 °C</div>
        <p className="text-xs text-slate-500 mt-1">+1.2% depuis 1h</p>
      </Card>
      <Card title="Humidité" icon={CloudSun}>
        <div className="text-3xl font-bold text-slate-800">58 %</div>
        <p className="text-xs text-slate-500 mt-1">Niveau optimal</p>
      </Card>
      <Card title="Humidité du Sol" icon={Droplets}>
        <div className="text-3xl font-bold text-slate-800">32 %</div>
        <p className="text-xs text-orange-500 mt-1">Seuil bas détecté</p>
      </Card>
      <Card title="Luminosité" icon={Droplets}>
        <div className="text-3xl font-bold text-slate-800">32 %</div>
        <p className="text-xs text-orange-500 mt-1">Seuil bas détecté</p>
      </Card>
      <Card title="Niveau de CO2" icon={Droplets}>
        <div className="text-3xl font-bold text-slate-800">0.2 %</div>
        <p className="text-xs text-orange-500 mt-1">Seuil bas détecté</p>
      </Card>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card title="Aperçu des cycles (24h)">
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_SENSOR_DATA}>
              <defs>
                <linearGradient id="colorMoist" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#059669" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#059669" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="time" hide />
              <YAxis hide />
              <Tooltip />
              <Area type="monotone" dataKey="moisture" stroke="#059669" fillOpacity={1} fill="url(#colorMoist)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

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
  </div>
);

const Monitoring = () => (
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
);

const ControlCenter = () => {
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

const AdminPanel = () => {
  const [users, setUsers] = useState(INITIAL_USERS);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Gestion des Utilisateurs</h2>
        <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium">
          <Plus size={16} /> Nouvel Utilisateur
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold">
            <tr>
              <th className="px-6 py-4">Utilisateur</th>
              <th className="px-6 py-4">Rôle</th>
              <th className="px-6 py-4">État</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.map(u => (
              <tr key={u.id} className="hover:bg-slate-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-slate-800">{u.username}</div>
                  <div className="text-xs text-slate-500">{u.email}</div>
                </td>
                <td className="px-6 py-4 text-slate-600">{u.role}</td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${u.is_active ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                    {u.is_active ? 'ACTIF' : 'INACTIF'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button className="text-slate-400 hover:text-emerald-600 transition-colors">Modifier</button>
                  <button className="text-slate-400 hover:text-red-600 transition-colors">Supprimer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Card title="Logs Système (Audit)" icon={Terminal}>
        <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-300 space-y-2 overflow-y-auto max-h-48">
          <p><span className="text-emerald-500">[15:40:02]</span> COMMAND_SENT: ACTIVATE_PUMP_A</p>
          <p><span className="text-emerald-500">[15:38:12]</span> SCRIPT_TRIGGER: AUTO_COOLING_INITIATED</p>
          <p><span className="text-emerald-500">[15:35:55]</span> DB_SYNC: 12 READINGS_UPLOADED_SUCCESS</p>
          <p><span className="text-amber-500">[15:30:00]</span> ALERT_GENERATED: LOW_MOISTURE_DETECTED</p>
        </div>
      </Card>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [isLoggedIn, setIsLoggedIn] = useState(true);

  // Simple Login Guard
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-emerald-100 rounded-2xl text-emerald-600 mb-4">
              <CloudSun size={32} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Système Agricole</h1>
            <p className="text-slate-500 text-sm mt-2">Authentification sécurisée</p>
          </div>
          
          <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setIsLoggedIn(true); }}>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email / Identifiant</label>
              <input type="text" required placeholder="admin_jean" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Mot de passe</label>
              <input type="password" required placeholder="••••••••" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="remember" className="rounded text-emerald-600 border-slate-300" />
              <label htmlFor="remember" className="text-sm text-slate-600">Se souvenir de moi</label>
            </div>
            <button className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-emerald-200 hover:bg-emerald-700 active:scale-[0.98] transition-all">
              Se connecter
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 antialiased font-sans">
      {/* Sidebar */}
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

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between px-8">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="capitalize">{currentPage}</span>
            <ChevronRight size={14} />
            <span className="text-slate-800 font-medium">Aperçu en direct</span>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
               AJ
             </div>
             <div className="hidden sm:block text-right">
               <p className="text-xs font-bold text-slate-800">Admin Jean</p>
               <p className="text-[10px] text-slate-500">Dernière connexion: 15:30</p>
             </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl w-full mx-auto">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'monitoring' && <Monitoring />}
          {currentPage === 'control' && <ControlCenter />}
          {currentPage === 'admin' && <AdminPanel />}
          {(currentPage === 'alerts' || currentPage === 'logs') && (
            <div className="p-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-3xl">
              <Activity className="mx-auto mb-4 opacity-20" size={48} />
              <p>Module de données historiques étendu bientôt disponible.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}