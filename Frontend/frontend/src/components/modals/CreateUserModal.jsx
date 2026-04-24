import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import { useApp } from '../../context/AppContext';

const FIELD = 'w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all placeholder:text-slate-300';

export default function CreateUserModal() {
  const { setCreateUserModalOpen } = useApp();

  const [form, setForm] = useState({ username: '', email: '', password: '', role: 'viewer' });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: wire to POST /api/users/
    setCreateUserModalOpen(false);
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100">

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-emerald-100 rounded-lg">
            <UserPlus size={15} className="text-emerald-600" />
          </div>
          <h3 className="font-semibold text-slate-800">Créer un utilisateur</h3>
        </div>
        <button
          type="button"
          onClick={() => setCreateUserModalOpen(false)}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Form */}
      <form className="px-6 py-5 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Nom d'utilisateur
          </label>
          <input
            type="text"
            required
            placeholder="ex: operator_marie"
            value={form.username}
            onChange={set('username')}
            className={FIELD}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Adresse email
          </label>
          <input
            type="email"
            required
            placeholder="marie@ferme.ci"
            value={form.email}
            onChange={set('email')}
            className={FIELD}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Mot de passe
          </label>
          <input
            type="password"
            required
            placeholder="••••••••"
            value={form.password}
            onChange={set('password')}
            className={FIELD}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Rôle
          </label>
          <select
            value={form.role}
            onChange={set('role')}
            className={FIELD}
          >
            <option value="admin">Admin — accès complet</option>
            <option value="viewer">Viewer — lecture seule</option>
          </select>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
          >
            Créer le compte
          </button>
          <button
            type="button"
            onClick={() => setCreateUserModalOpen(false)}
            className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
