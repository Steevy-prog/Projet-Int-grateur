import { useState, useEffect } from 'react';
import { Bell, CheckCircle2, Filter, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const MOCK_ALERTS = [
  { id: 1, alert_type: 'threshold_breach', severity: 'critical', message: 'Humidité du sol en dessous du seuil minimum (18%)', sensor_name: 'Capteur Sol YL-69', actuator_name: null, triggered_at: '2026-04-24 15:40', acknowledged: false },
  { id: 2, alert_type: 'threshold_breach', severity: 'warning', message: 'Température dépasse le seuil (29.5 °C)', sensor_name: 'Capteur Temp DHT22', actuator_name: null, triggered_at: '2026-04-24 15:30', acknowledged: false },
  { id: 3, alert_type: 'co2_spike', severity: 'warning', message: 'Pic de CO₂ détecté (1450 ppm)', sensor_name: 'Capteur CO₂ SEN0159', actuator_name: null, triggered_at: '2026-04-24 14:55', acknowledged: true },
  { id: 4, alert_type: 'sensor_offline', severity: 'critical', message: 'Capteur hors ligne depuis plus de 5 minutes', sensor_name: 'Capteur Niveau Eau', actuator_name: null, triggered_at: '2026-04-24 13:20', acknowledged: true },
  { id: 5, alert_type: 'actuator_failure', severity: 'critical', message: "Pompe A n'a pas répondu à la commande d'activation", sensor_name: null, actuator_name: 'Pompe Irrigation A', triggered_at: '2026-04-24 12:10', acknowledged: true },
  { id: 6, alert_type: 'sensor_recovered', severity: 'info', message: 'Capteur de luminosité de nouveau en ligne', sensor_name: 'Capteur Lumière BH1750', actuator_name: null, triggered_at: '2026-04-24 11:30', acknowledged: true },
];

const SEVERITY_STYLES = {
  critical: 'bg-red-100 text-red-700',
  warning:  'bg-amber-100 text-amber-700',
  info:     'bg-blue-100 text-blue-700',
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

export default function Alerts() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [severityFilter, setSeverityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [alerts, setAlerts] = useState(MOCK_ALERTS);

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  const filtered = alerts.filter(a => {
    if (severityFilter !== 'all' && a.severity !== severityFilter) return false;
    if (statusFilter === 'acknowledged' && !a.acknowledged) return false;
    if (statusFilter === 'pending' && a.acknowledged) return false;
    return true;
  });

  const pendingCount = alerts.filter(a => !a.acknowledged).length;

  const handleAcknowledge = (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800">Historique des Alertes</h2>
          {pendingCount > 0 && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
              {pendingCount} non acquittée{pendingCount > 1 ? 's' : ''}
            </span>
          )}
        </div>
        <span className="text-sm text-slate-500">{filtered.length} alerte{filtered.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 bg-white border border-slate-200 rounded-xl p-4 shadow-sm items-center">
        <Filter size={14} className="text-slate-400" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sévérité</span>
        {[['all', 'Toutes'], ['critical', 'Critique'], ['warning', 'Avertissement'], ['info', 'Info']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setSeverityFilter(val)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              severityFilter === val ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
        <div className="w-px bg-slate-200 self-stretch" />
        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Statut</span>
        {[['all', 'Tous'], ['pending', 'En attente'], ['acknowledged', 'Acquittées']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setStatusFilter(val)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              statusFilter === val ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden border border-slate-200 rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-bold tracking-wider">
            <tr>
              <th className="px-6 py-3">Type</th>
              <th className="px-6 py-3">Sévérité</th>
              <th className="px-6 py-3">Message</th>
              <th className="px-6 py-3">Source</th>
              <th className="px-6 py-3">Déclenchée le</th>
              <th className="px-6 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-10 text-center text-slate-400 text-sm">
                  Aucune alerte correspondante
                </td>
              </tr>
            ) : filtered.map(alert => (
              <tr key={alert.id} className="hover:bg-slate-50">
                <td className="px-6 py-4 font-medium text-slate-700 whitespace-nowrap">
                  {ALERT_TYPE_LABELS[alert.alert_type] || alert.alert_type}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${SEVERITY_STYLES[alert.severity]}`}>
                    {alert.severity}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-600 max-w-xs">{alert.message}</td>
                <td className="px-6 py-4 text-slate-500 whitespace-nowrap text-xs">
                  {alert.sensor_name || alert.actuator_name || '—'}
                </td>
                <td className="px-6 py-4 text-slate-400 whitespace-nowrap text-xs">{alert.triggered_at}</td>
                <td className="px-6 py-4 text-right">
                  {alert.acknowledged ? (
                    <span className="inline-flex items-center gap-1 text-xs text-green-600 font-medium">
                      <CheckCircle2 size={12} /> Acquittée
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleAcknowledge(alert.id)}
                      className="text-xs px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors font-medium"
                    >
                      Acquitter
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
