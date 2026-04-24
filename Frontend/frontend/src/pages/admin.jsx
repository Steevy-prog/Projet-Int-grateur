import { useState, useEffect, useCallback } from 'react';
import { Plus, Shield, Eye, UserCheck, UserX, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import CreateUserModal from '../components/modals/CreateUserModal';
import * as usersApi from '../services/users';

const ROLE_STYLES = {
  admin:  { icon: Shield, badge: 'bg-purple-100 text-purple-700', label: 'Admin'  },
  viewer: { icon: Eye,    badge: 'bg-blue-100 text-blue-700',     label: 'Viewer' },
};

export default function Admin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { createUserModalOpen, setCreateUserModalOpen } = useApp();

  const [users,        setUsers]       = useState([]);
  const [loading,      setLoading]     = useState(true);
  const [togglingId,   setTogglingId]  = useState(null);
  const [errorMsg,     setErrorMsg]    = useState('');

  useEffect(() => {
    if (!user)                navigate('/');
    else if (user.role !== 'admin') navigate('/dashboard');
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await usersApi.list());
    } catch { /* show empty state */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (u) => {
    setTogglingId(u.id);
    setErrorMsg('');
    try {
      const updated = await usersApi.update(u.id, { is_active: !u.is_active });
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
    } catch (err) {
      setErrorMsg(err.message);
      setTimeout(() => setErrorMsg(''), 4000);
    } finally {
      setTogglingId(null);
    }
  };

  const onUserCreated = (newUser) => {
    setUsers(prev => [...prev, newUser]);
  };

  const activeCount  = users.filter(u => u.is_active).length;
  const adminCount   = users.filter(u => u.role === 'admin').length;
  const viewerCount  = users.filter(u => u.role === 'viewer').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestion des Utilisateurs</h2>
          <p className="text-sm text-slate-400 mt-0.5">{users.length} compte{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button type="button" onClick={() => setCreateUserModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm self-start sm:self-auto">
          <Plus size={15} />
          Nouvel utilisateur
        </button>
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2.5">
          <span className="h-2 w-2 rounded-full bg-red-500 shrink-0" />
          {errorMsg}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Actifs',  value: activeCount, color: 'text-emerald-600' },
          { label: 'Admins',  value: adminCount,  color: 'text-purple-600'  },
          { label: 'Viewers', value: viewerCount, color: 'text-blue-600'    },
        ].map(s => (
          <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-700 text-sm">Comptes utilisateurs</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="px-5 py-8 text-sm text-slate-400 text-center">Aucun utilisateur.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Utilisateur</th>
                <th className="px-5 py-3">Rôle</th>
                <th className="px-5 py-3">État</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(u => {
                const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.viewer;
                const RoleIcon  = roleStyle.icon;
                const isSelf    = u.id === user?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                          {u.username.split('_').map(w => w[0]?.toUpperCase()).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{u.username}</p>
                          <p className="text-[11px] text-slate-400">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${roleStyle.badge}`}>
                        <RoleIcon size={10} />
                        {roleStyle.label}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                        <span className={`text-xs font-medium ${u.is_active ? 'text-emerald-700' : 'text-slate-500'}`}>
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button"
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Modifier">
                          <Pencil size={13} />
                        </button>
                        <button type="button"
                          disabled={isSelf || togglingId === u.id}
                          onClick={() => toggleActive(u)}
                          title={isSelf ? 'Impossible de modifier son propre compte' : u.is_active ? 'Désactiver' : 'Activer'}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 ${
                            u.is_active
                              ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                              : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                          }`}
                        >
                          {togglingId === u.id
                            ? <span className="h-3 w-3 border border-current border-t-transparent rounded-full animate-spin inline-block" />
                            : u.is_active ? <UserX size={13} /> : <UserCheck size={13} />
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {createUserModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <CreateUserModal onCreated={onUserCreated} />
        </div>
      )}
    </div>
  );
}
