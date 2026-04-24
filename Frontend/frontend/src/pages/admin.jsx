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
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Card from '../components/common/card';
import { useNavigate } from 'react-router-dom';



const INITIAL_USERS = [
  { id: 1, username: 'admin_jean', email: 'jean@ferme.ci', role: 'Admin', is_active: true },
  { id: 2, username: 'operator_marc', email: 'marc@ferme.ci', role: 'Operator', is_active: true },
];


const Admin = () => {
  const navigate = useNavigate();

  const { user } = useAuth();
  
    useEffect(() => {
      if (!user) {
        navigate('/');
      }else if (user?.role !== 'admin') {
        navigate('/dashboard');
      }
    }, [user]);

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

export default Admin;