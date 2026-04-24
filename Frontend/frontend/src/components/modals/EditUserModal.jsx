import { useState } from 'react';
import { UserCog, X } from 'lucide-react';
import * as usersApi from '../../services/users';
import { useToast } from '../../context/ToastContext';

const FIELD = 'w-full border border-slate-200 bg-slate-50 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all';

export default function EditUserModal({ user, onUpdated, onClose }) {
  const toast = useToast();
  const [form, setForm] = useState({
    role:      user.role,
    language:  user.language ?? 'fr',
    is_active: user.is_active,
  });
  const [saving, setSaving] = useState(false);

  const set = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await usersApi.update(user.id, form);
      toast.success('Utilisateur mis à jour.');
      onUpdated(updated);
      onClose();
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la mise à jour.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-100">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-100 rounded-lg">
            <UserCog size={15} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-800">Modifier l'utilisateur</h3>
            <p className="text-[11px] text-slate-400 mt-0.5">{user.username} — {user.email}</p>
          </div>
        </div>
        <button type="button" onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors">
          <X size={16} />
        </button>
      </div>

      <form className="px-6 py-5 space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Rôle</label>
          <select value={form.role} onChange={set('role')} className={FIELD}>
            <option value="admin">Admin — accès complet</option>
            <option value="viewer">Viewer — lecture seule</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Langue</label>
          <select value={form.language} onChange={set('language')} className={FIELD}>
            <option value="fr">Français</option>
            <option value="en">English</option>
          </select>
        </div>

        <div className="flex items-center justify-between bg-slate-50 rounded-lg px-4 py-3 border border-slate-200">
          <div>
            <p className="text-sm font-semibold text-slate-700">Compte actif</p>
            <p className="text-xs text-slate-400 mt-0.5">Désactiver bloque l'accès sans supprimer le compte</p>
          </div>
          <button type="button" onClick={() => setForm(prev => ({ ...prev, is_active: !prev.is_active }))}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
              form.is_active ? 'bg-emerald-500' : 'bg-slate-300'
            }`}>
            <span className={`inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${
              form.is_active ? 'translate-x-5' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <div className="flex gap-3 pt-1">
          <button type="submit" disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60">
            {saving
              ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Enregistrer'
            }
          </button>
          <button type="button" onClick={onClose}
            className="flex-1 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
