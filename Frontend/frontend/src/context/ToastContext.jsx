import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const add = useCallback((message, type = 'info') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => dismiss(id), 4000);
  }, [dismiss]);

  const toast = {
    success: (msg) => add(msg, 'success'),
    error:   (msg) => add(msg, 'error'),
    info:    (msg) => add(msg, 'info'),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

const STYLES = {
  success: { bar: 'bg-emerald-500', bg: 'bg-white border-emerald-200', icon: '✓', iconCls: 'text-emerald-500' },
  error:   { bar: 'bg-red-500',     bg: 'bg-white border-red-200',     icon: '✕', iconCls: 'text-red-500'     },
  info:    { bar: 'bg-blue-500',    bg: 'bg-white border-blue-200',    icon: 'i', iconCls: 'text-blue-500'    },
};

function ToastContainer({ toasts, dismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2 w-80">
      {toasts.map(t => {
        const s = STYLES[t.type] || STYLES.info;
        return (
          <div key={t.id}
            className={`flex items-start gap-3 p-3 rounded-xl border shadow-lg ${s.bg} animate-in slide-in-from-right-5`}>
            <div className={`w-1 self-stretch rounded-full ${s.bar} shrink-0`} />
            <span className={`text-sm font-bold w-4 shrink-0 ${s.iconCls}`}>{s.icon}</span>
            <p className="flex-1 text-sm text-slate-700 leading-snug">{t.message}</p>
            <button onClick={() => dismiss(t.id)}
              className="text-slate-300 hover:text-slate-500 transition-colors shrink-0 text-lg leading-none">
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}
