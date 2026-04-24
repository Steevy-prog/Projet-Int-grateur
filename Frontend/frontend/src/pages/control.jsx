import { useState, useEffect } from 'react';
import { Power, Settings2, Save, RotateCcw, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/card';

const INITIAL_ACTUATORS = [
  { id: 1, name: 'Pompe Irrigation A', type: 'Irrigation',  status: 'OFF', lastTriggered: 'Il y a 5 min'  },
  { id: 2, name: 'Ventilateur',        type: 'Ventilation', status: 'ON',  lastTriggered: 'Il y a 12 min' },
  { id: 3, name: 'Éclairage LED',      type: 'Lumière',     status: 'OFF', lastTriggered: 'Il y a 2h'     },
];

const INITIAL_THRESHOLDS = [
  { key: 'temperature', label: 'Température',  unit: '°C',  min: 18,   max: 35   },
  { key: 'humidity',    label: 'Humidité Air', unit: '%',   min: 40,   max: 80   },
  { key: 'co2',         label: 'CO₂',          unit: 'ppm', min: 400,  max: 1500 },
  { key: 'light',       label: 'Luminosité',   unit: 'lx',  min: 1000, max: 50000},
  { key: 'water',       label: 'Niveau Eau',   unit: '%',   min: 20,   max: 90   },
];

export default function Control() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [actuators,   setActuators]   = useState(INITIAL_ACTUATORS);
  const [thresholds,  setThresholds]  = useState(INITIAL_THRESHOLDS);
  const [savedMsg,    setSavedMsg]    = useState('');

  useEffect(() => {
    if (!user) navigate('/');
  }, [user]);

  const toggleActuator = (id) => {
    setActuators(prev =>
      prev.map(a => a.id === id ? { ...a, status: a.status === 'ON' ? 'OFF' : 'ON' } : a)
    );
  };

  const updateThreshold = (key, field, value) => {
    setThresholds(prev =>
      prev.map(t => t.key === key ? { ...t, [field]: Number(value) } : t)
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    setSavedMsg('Seuils mis à jour avec succès.');
    setTimeout(() => setSavedMsg(''), 3000);
  };

  const handleReset = () => {
    setThresholds(INITIAL_THRESHOLDS);
  };

  return (
    <div className="space-y-6">

      <div>
        <h2 className="text-xl font-bold text-slate-800">Contrôle & Seuils</h2>
        <p className="text-sm text-slate-400 mt-0.5">Contrôle manuel des actionneurs et configuration des seuils</p>
      </div>

      {/* Actuators */}
      <Card title="Actionneurs — Contrôle Manuel" icon={Zap}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {actuators.map(a => (
            <div
              key={a.id}
              className={`rounded-xl border p-4 transition-all ${
                a.status === 'ON'
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                  <p className="text-xs text-slate-400">{a.type}</p>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  a.status === 'ON' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                }`}>
                  {a.status}
                </span>
              </div>

              <p className="text-[11px] text-slate-400 mb-3">Dernier déclenchement: {a.lastTriggered}</p>

              <button
                type="button"
                onClick={() => toggleActuator(a.id)}
                className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold transition-all active:scale-95 ${
                  a.status === 'ON'
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-200'
                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                }`}
              >
                <Power size={14} />
                {a.status === 'ON' ? 'Désactiver' : 'Activer'}
              </button>
            </div>
          ))}
        </div>
      </Card>

      {/* Thresholds */}
      <Card title="Seuils d'Automatisation" icon={Settings2}>
        {savedMsg && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm rounded-lg px-4 py-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {savedMsg}
          </div>
        )}

        <form onSubmit={handleSave}>
          {/* Table header */}
          <div className="grid grid-cols-[1fr_120px_120px_60px] gap-3 px-1 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Capteur</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Min</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Max</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Unité</span>
          </div>

          <div className="space-y-2">
            {thresholds.map(t => (
              <div
                key={t.key}
                className="grid grid-cols-[1fr_120px_120px_60px] gap-3 items-center bg-slate-50 rounded-lg px-3 py-3"
              >
                <span className="text-sm font-medium text-slate-700">{t.label}</span>
                <input
                  type="number"
                  value={t.min}
                  onChange={e => updateThreshold(t.key, 'min', e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                <input
                  type="number"
                  value={t.max}
                  onChange={e => updateThreshold(t.key, 'max', e.target.value)}
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm text-center focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none transition-all"
                />
                <span className="text-xs text-slate-400 text-center font-mono">{t.unit}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-3 mt-5">
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm"
            >
              <Save size={14} />
              Enregistrer
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-2 px-5 py-2 bg-white border border-slate-300 text-slate-600 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              <RotateCcw size={14} />
              Réinitialiser
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
