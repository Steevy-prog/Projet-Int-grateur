import { useState, useEffect, useCallback } from 'react';
import { Power, Settings2, Save, RotateCcw, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import Card from '../components/common/card';
import { useWebSocket } from '../hooks/useWebSocket';
import * as actuatorsApi  from '../services/actuators';
import * as thresholdsApi from '../services/thresholds';

function formatTime(iso) {
  if (!iso) return 'Jamais';
  const diff = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (diff < 60)   return `Il y a ${diff}s`;
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  return `Il y a ${Math.floor(diff / 3600)}h`;
}

export default function Control() {
  const navigate = useNavigate();
  const { user }  = useAuth();
  const toast     = useToast();

  const [actuators,      setActuators]      = useState([]);
  const [thresholds,     setThresholds]     = useState([]);
  const [origThresholds, setOrigThresholds] = useState([]);
  const [loading,        setLoading]        = useState(true);
  const [toggling,       setToggling]       = useState(null);
  const [saving,         setSaving]         = useState(false);

  useEffect(() => { if (!user) navigate('/'); }, [user]);

  const load = useCallback(async () => {
    try {
      const [acts, thrs] = await Promise.all([
        actuatorsApi.list(),
        thresholdsApi.list(),
      ]);
      setActuators(acts);
      const mapped = thrs.map(t => ({
        key:   t.sensor_type,
        label: THRESHOLD_LABELS[t.sensor_type] || t.sensor_type,
        unit:  THRESHOLD_UNITS[t.sensor_type] || '',
        min:   parseFloat(t.min_value),
        max:   parseFloat(t.max_value),
      }));
      setThresholds(mapped);
      setOrigThresholds(mapped);
    } catch (err) {
      toast.error(err.message || 'Impossible de charger les données.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useWebSocket((event) => {
    if (event.type === 'actuator.updated') {
      setActuators(prev => prev.map(a =>
        a.id === event.actuator_id
          ? { ...a, status: event.status, last_triggered_at: event.last_triggered_at }
          : a
      ));
    }
  });

  const toggleActuator = async (actuator) => {
    const action_type = actuator.status === 'on' ? 'turn_off' : 'turn_on';
    setToggling(actuator.id);
    try {
      const res = await actuatorsApi.trigger(actuator.id, action_type);
      setActuators(prev => prev.map(a => a.id === actuator.id ? res.actuator : a));
      toast.success(`${actuator.name} ${action_type === 'turn_on' ? 'activé' : 'désactivé'}.`);
    } catch (err) {
      toast.error(err.message || 'Erreur lors du contrôle de l\'actionneur.');
    } finally {
      setToggling(null);
    }
  };

  const updateThreshold = (key, field, value) => {
    setThresholds(prev => prev.map(t => t.key === key ? { ...t, [field]: Number(value) } : t));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await Promise.all(
        thresholds.map(t =>
          thresholdsApi.update(t.key, { min_value: t.min, max_value: t.max })
        )
      );
      setOrigThresholds(thresholds);
      toast.success('Seuils mis à jour avec succès.');
    } catch (err) {
      toast.error(err.message || 'Erreur lors de la sauvegarde des seuils.');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => setThresholds(origThresholds);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Contrôle & Seuils</h2>
        <p className="text-sm text-slate-400 mt-0.5">Contrôle manuel des actionneurs et configuration des seuils</p>
      </div>

      {/* Actuators */}
      <Card title="Actionneurs — Contrôle Manuel" icon={Zap}>
        {actuators.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun actionneur configuré.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {actuators.map(a => (
              <div key={a.id} className={`rounded-xl border p-4 transition-all ${
                a.status === 'on' ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
              }`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                    <p className="text-xs text-slate-400">{a.type}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    a.status === 'on' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {a.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mb-3">Dernier déclenchement: {formatTime(a.last_triggered_at)}</p>
                <button type="button"
                  disabled={toggling === a.id}
                  onClick={() => toggleActuator(a)}
                  className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 ${
                    a.status === 'on'
                      ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {toggling === a.id
                    ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <Power size={14} />
                  }
                  {a.status === 'on' ? 'Désactiver' : 'Activer'}
                </button>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Thresholds */}
      <Card title="Seuils d'Automatisation" icon={Settings2}>
        {thresholds.length === 0 ? (
          <p className="text-sm text-slate-400">Aucun seuil configuré.</p>
        ) : (
          <form onSubmit={handleSave}>
            <div className="grid grid-cols-[1fr_120px_120px_60px] gap-3 px-1 mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capteur</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Min</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Max</span>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Unité</span>
            </div>
            <div className="space-y-2">
              {thresholds.map(t => (
                <div key={t.key} className="grid grid-cols-[1fr_120px_120px_60px] gap-3 items-center bg-slate-50 rounded-lg px-3 py-3">
                  <span className="text-sm font-medium text-slate-700">{t.label}</span>
                  <input type="number" value={t.min} onChange={e => updateThreshold(t.key, 'min', e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                  <input type="number" value={t.max} onChange={e => updateThreshold(t.key, 'max', e.target.value)}
                    className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all" />
                  <span className="text-xs text-slate-400 text-center font-mono">{t.unit}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 mt-5">
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-60">
                {saving
                  ? <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  : <Save size={14} />
                }
                Enregistrer
              </button>
              <button type="button" onClick={handleReset}
                className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors">
                <RotateCcw size={14} />
                Réinitialiser
              </button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
}

const THRESHOLD_LABELS = {
  temperature: 'Température',
  humidity:    'Humidité Air',
  co2:         'CO₂',
  luminosity:  'Luminosité',
  water_level: 'Niveau Eau',
};

const THRESHOLD_UNITS = {
  temperature: '°C',
  humidity:    '%',
  co2:         'ppm',
  luminosity:  'lx',
  water_level: '%',
};
