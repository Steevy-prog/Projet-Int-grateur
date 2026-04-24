import { useState, useEffect } from 'react';
import { Leaf, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const navigate   = useNavigate();
  const { user, login } = useAuth();

  const [identifier, setIdentifier] = useState('');
  const [password,   setPassword]   = useState('');
  const [showPwd,    setShowPwd]     = useState(false);
  const [error,      setError]       = useState('');
  const [loading,    setLoading]     = useState(false);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const result = await login(identifier, password);
    setLoading(false);
    if (!result?.success) {
      setError('Identifiant ou mot de passe incorrect.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-200 mb-4">
            <Leaf size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">AgriSmart</h1>
          <p className="text-slate-500 text-sm mt-1">Gestion intelligente de serre</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
          <h2 className="text-lg font-semibold text-slate-800 mb-1">Connexion</h2>
          <p className="text-sm text-slate-400 mb-6">Accès réservé au personnel autorisé</p>

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-5">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Identifiant
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                placeholder="admin_jean"
                value={identifier}
                onChange={e => setIdentifier(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Mot de passe
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 pr-10 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all text-sm text-slate-800 placeholder:text-slate-300"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm shadow-md shadow-emerald-100 active:scale-[0.98] transition-all"
            >
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400 mt-6">
          AgriSmart v1.0 — UCAC-ICAM 2026
        </p>
      </div>
    </div>
  );
}
