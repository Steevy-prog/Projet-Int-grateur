import { useState, useEffect, useCallback } from 'react';
import { Plus, Shield, Eye, UserCheck, UserX, Pencil } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { useToast } from '../context/ToastContext';
import CreateUserModal from '../components/modals/CreateUserModal';
import EditUserModal   from '../components/modals/EditUserModal';
import * as usersApi from '../services/users';

const ROLE_STYLES = {
  admin:  { icon: Shield, badge: 'bg-purple-100 text-purple-700', label: 'Admin'  },
  viewer: { icon: Eye,    badge: 'bg-blue-100 text-blue-700',     label: 'Viewer' },
};

export default function Admin() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const toast     = useToast();
  const { createUserModalOpen, setCreateUserModalOpen } = useApp();

  const [users,       setUsers]      = useState([]);
  const [loading,     setLoading]    = useState(true);
  const [togglingId,  setTogglingId] = useState(null);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    if (!user)                  navigate('/');
    else if (user.role !== 'admin') navigate('/dashboard');
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await usersApi.list());
    } catch (err) {
      toast.error(err.message || 'Impossible de charger les utilisateurs.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const toggleActive = async (u) => {
    setTogglingId(u.id);
    try {
      const updated = await usersApi.update(u.id, { is_active: !u.is_active });
      setUsers(prev => prev.map(x => x.id === u.id ? updated : x));
      toast.success(updated.is_active ? `${u.username} activé.` : `${u.username} désactivé.`);
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setTogglingId(null);
    }
  };

  const onUserCreated = (newUser) => {
    setUsers(prev => [...prev, newUser]);
    toast.success(`Compte "${newUser.username}" créé avec succès.`);
  };

  const onUserUpdated = (updatedUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  const activeCount  = users.filter(u => u.is_active).length;
  const adminCount   = users.filter(u => u.role === 'admin').length;
  const viewerCount  = users.filter(u => u.role === 'viewer').length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Gestion des Utilisateurs</h2>
          <p className="text-sm text-slate-600 mt-0.5">{users.length} compte{users.length !== 1 ? 's' : ''} enregistré{users.length !== 1 ? 's' : ''}</p>
        </div>
        <button type="button" onClick={() => setCreateUserModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-black/70 text-white rounded-lg text-sm font-semibold hover:bg-black/90 transition-colors shadow-sm self-start sm:self-auto">
          <span className="text-green-400">
            <Plus size={15} />
          </span>
          Nouvel utilisateur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Actifs',  value: activeCount, color: 'text-emerald-400' },
          { label: 'Admins',  value: adminCount,  color: 'text-purple-400'  },
          { label: 'Viewers', value: viewerCount, color: 'text-blue-400'    },
        ].map(s => (
          <div key={s.label} className="bg-black/70 backdrop-blur-sm border border-slate-200 rounded-xl p-4 shadow-sm text-center">
            <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-xs text-slate-50 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl bg-black/70 backdrop-blur-sm shadow-sm">
        <div className="px-5 py-4 bg-slate-700 border-b border-slate-100">
          <h3 className="font-semibold text-white text-center text-sm">Comptes utilisateurs</h3>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : users.length === 0 ? (
          <p className="px-5 py-8 text-sm white text-center">Aucun utilisateur.</p>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="text-slate-50 border-b border-white text-[11px] font-bold uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3">Utilisateur</th>
                <th className="px-5 py-3">Rôle</th>
                <th className="px-5 py-3">État</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white">
              {users.map(u => {
                const roleStyle = ROLE_STYLES[u.role] || ROLE_STYLES.viewer;
                const RoleIcon  = roleStyle.icon;
                const isSelf    = u.id === user?.id;
                return (
                  <tr key={u.id} className="hover:bg-slate-800 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center text-slate-600 text-xs font-bold shrink-0">
                          {u.username.split('_').map(w => w[0]?.toUpperCase()).join('').slice(0, 2)}
                        </div>
                        <div>
                          <p className="font-semibold text-white">{u.username}</p>
                          <p className="text-[11px] text-white/50">{u.email}</p>
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
                        <span className={`h-1.5 w-1.5 rounded-full ${u.is_active ? 'bg-emerald-500' : 'bg-white'}`} />
                        <span className={`text-xs font-medium ${u.is_active ? 'text-emerald-400' : 'text-white'}`}>
                          {u.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button type="button"
                          onClick={() => setEditingUser(u)}
                          className="p-1.5 text-white hover:text-emerald-400 rounded-lg transition-colors cursor-pointer"
                          title="Modifier">
                          <Pencil size={13} />
                        </button>
                        <button type="button"
                          disabled={isSelf || togglingId === u.id}
                          onClick={() => toggleActive(u)}
                          title={isSelf ? 'Impossible de modifier son propre compte' : u.is_active ? 'Désactiver' : 'Activer'}
                          className={`p-1.5 rounded-lg transition-colors disabled:opacity-40 cursor-pointer ${
                            u.is_active
                              ? 'text-white hover:text-red-400'
                              : 'text-white hover:text-emerald-400'
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

      {editingUser && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <EditUserModal
            user={editingUser}
            onUpdated={onUserUpdated}
            onClose={() => setEditingUser(null)}
          />
        </div>
      )}
    </div>
  );
}
