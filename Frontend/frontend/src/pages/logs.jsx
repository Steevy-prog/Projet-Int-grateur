import { useState, useEffect, useCallback } from 'react';
import { Terminal, CheckCircle2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import * as logsApi from '../services/logs';

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'medium' });
}

export default function Logs() {
  const navigate = useNavigate();
  const { user }  = useAuth();

  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [sourceFilter, setSourceFilter] = useState('all');
  const [resultFilter, setResultFilter] = useState('all');

  useEffect(() => {
    if (!user)                navigate('/');
    else if (user.role !== 'admin') navigate('/dashboard');
  }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setLogs(await logsApi.list());
    } catch { /* show empty state */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = logs.filter(log => {
    if (sourceFilter !== 'all' && log.source !== sourceFilter) return false;
    if (resultFilter !== 'all' && log.result !== resultFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Logs Système</h2>
        <span className="text-sm text-slate-500">{filtered.length} entrée{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm items-center">
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Source</span>
        {[['all', 'Toutes'], ['script', 'Script'], ['api', 'API']].map(([val, label]) => (
          <button key={val} type="button" onClick={() => setSourceFilter(val)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              sourceFilter === val ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {label}
          </button>
        ))}
        <div className="w-px bg-slate-200 self-stretch" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Résultat</span>
        {[['all', 'Tous'], ['success', 'Succès'], ['failure', 'Échec']].map(([val, label]) => (
          <button key={val} type="button" onClick={() => setResultFilter(val)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              resultFilter === val ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
        <div className="bg-slate-900 px-6 py-3 flex items-center gap-2">
          <Terminal size={14} className="text-emerald-400" />
          <span className="text-xs text-emerald-400 font-mono">AgriSmart — Journal d'activité système</span>
        </div>
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3">Commande</th>
                <th className="px-6 py-3">Résultat</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Exécuté par</th>
                <th className="px-6 py-3">Horodatage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400 text-sm">Aucun log correspondant</td>
                </tr>
              ) : filtered.map(log => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4">
                    <div className="font-mono text-xs text-slate-700">{log.command}</div>
                    {log.script_name && (
                      <div className="font-mono text-[10px] text-slate-400 mt-0.5">{log.script_name}</div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {log.result === 'success' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-green-100 text-green-700">
                        <CheckCircle2 size={10} /> SUCCESS
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700">
                        <XCircle size={10} /> FAILURE
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.source === 'script' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {(log.source || '').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500 text-xs font-mono">{log.executed_by || '—'}</td>
                  <td className="px-6 py-4 text-slate-400 text-xs font-mono">{formatDate(log.executed_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
