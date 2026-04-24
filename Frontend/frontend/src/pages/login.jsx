import { React, useState, useEffect } from 'react';
import { CloudSun } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';



export default function Login() {

  const navigate = useNavigate();

  const { user, login } = useAuth();
  // const user = null;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');


  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user]);

  const handleLogin = () => {
    login(email, password)
  }

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
        
        <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Email / Identifiant</label>
            <input 
              type="text" 
              required 
              placeholder="admin_jean" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-1">Mot de passe</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
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
  )
}