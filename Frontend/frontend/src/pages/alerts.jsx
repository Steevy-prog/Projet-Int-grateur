import { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCircle2, Filter, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { useWebSocket } from '../hooks/useWebSocket';
import * as alertsApi from '../services/alerts';

const SEVERITY_STYLES = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-amber-100 text-amber-700',
  low:    'bg-blue-100 text-blue-700',
};

const ALERT_TYPE_LABELS = {
  threshold_breach:   'Seuil dépassé',
  sensor_offline:     'Capteur hors ligne',
  sensor_recovered:   'Capteur rétabli',
  actuator_failure:   'Défaut actionneur',
  actuator_recovered: 'Actionneur rétabli',
  co2_spike:          'Pic CO₂',
  system_error:       'Erreur système',
};

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
}

export default function Alerts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast    = useToast();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [alerts,    setAlerts]   = useState([]);
  const [loading,   setLoading]  = useState(true);
  const [ackLoading, setAckLoading] = useState(null);

  useEffect(() => { if (!user) navigate('/'); }, [user]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await alertsApi.list();
      setAlerts(data);
    } catch (err) {
      toast.error(err.message || 'Impossible de charger les alertes.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useWebSocket((event) => {
    if (event.type === 'alert.new') {
      setAlerts(prev => [{
        id: event.alert_id, type: event.alert_type, severity: event.severity,
        message: event.message, sensor_name: event.sensor_name,
        actuator_name: event.actuator_name, triggered_at: event.triggered_at,
        is_acknowledged: false,
      }, ...prev]);
    }
    if (event.type === 'alert.acknowledged') {
      setAlerts(prev => prev.map(a =>
        a.id === event.alert_id
          ? { ...a, is_acknowledged: true, acknowledged_by: event.acknowledged_by, acknowledged_at: event.acknowledged_at }
          : a
      ));
    }
  });

  const handleAcknowledge = async (id) => {
    setAckLoading(id);
    try {
      const updated = await alertsApi.acknowledge(id);
      setAlerts(prev => prev.map(a => a.id === id ? { ...a, ...updated } : a));
      toast.success('Alerte acquittée.');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de l\'acquittement.');
    } finally { setAckLoading(null); }
  };

  const filtered = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter === 'acknowledged' && !a.is_acknowledged)      return false;
    if (statusFilter === 'pending'      &&  a.is_acknowledged)      return false;
    return true;
  });

  const pendingCount = alerts.filter(a => !a.is_acknowledged).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Historique des Alertes</h2>
          {pendingCount > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700">
              {pendingCount} non acquittée{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-sm bg-black/60 text-white px-3 py-1.5 rounded-lg shadow-sm font-medium">{filtered.length} alerte{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-black/60 border border-slate-200 rounded-xl p-4 shadow-sm items-center">
        <Filter size={14} className="text-slate-50" />
        <span className="text-xs font-bold text-slate-50 uppercase tracking-wider">Sévérité</span>
        {[['all', 'Toutes'], ['high', 'Élevée'], ['medium', 'Moyenne'], ['low', 'Faible']].map(([val, label]) => (
          <button key={val} onClick={() => setSeverityFilter(val)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              severityFilter === val ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-200 cursor-pointer'
            }`}>
            {label}
          </button>
        ))}
        <div className="w-px bg-slate-200 self-stretch" />
        <span className="text-xs font-bold text-slate-50 uppercase tracking-wider">Statut</span>
        {[['all', 'Tous'], ['pending', 'En attente'], ['acknowledged', 'Acquittées']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === val ? 'bg-emerald-700 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-200 cursor-pointer'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl bg-black/70 backdrop-blur-xs shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="h-6 w-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-700 text-white uppercase text-[11px] font-bold tracking-wider">
              <tr>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Sévérité</th>
                <th className="px-6 py-3">Message</th>
                <th className="px-6 py-3">Source</th>
                <th className="px-6 py-3">Déclenchée le</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-white text-sm">Aucune alerte correspondante</td>
                </tr>
              ) : filtered.map(alert => (
                <tr key={alert.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 text-white whitespace-nowrap">
                    {ALERT_TYPE_LABELS[alert.type] || alert.type}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${SEVERITY_STYLES[alert.severity] || ''}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-white max-w-xs">{alert.message}</td>
                  <td className="px-6 py-4 text-white whitespace-nowrap text-xs">
                    {alert.sensor_name || alert.actuator_name || '—'}
                  </td>
                  <td className="px-6 py-4 text-white whitespace-nowrap text-xs">{formatDate(alert.triggered_at)}</td>
                  <td className="px-6 py-4 text-right">
                    {alert.is_acknowledged ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                        <CheckCircle2 size={12} /> Acquittée
                      </span>
                    ) : (
                      <button type="button"
                        disabled={ackLoading === alert.id}
                        onClick={() => handleAcknowledge(alert.id)}
                        className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium disabled:opacity-50"
                      >
                        {ackLoading === alert.id ? '…' : 'Acquitter'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
