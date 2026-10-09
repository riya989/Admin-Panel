import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

type ToastListener = (toasts: ToastMessage[]) => void;

let toastsState: ToastMessage[] = [];
const listeners: Set<ToastListener> = new Set();

function notifyListeners() {
  listeners.forEach((listener) => listener([...toastsState]));
}

export const toast = {
  show: (t: Omit<ToastMessage, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastMessage = { ...t, id };
    toastsState = [newToast, ...toastsState].slice(0, 5); // Keep max 5 toasts
    notifyListeners();

    const duration = t.duration ?? (t.type === 'error' ? 6000 : 4000);
    setTimeout(() => {
      toast.dismiss(id);
    }, duration);

    return id;
  },
  error: (title: string, message?: string) => {
    return toast.show({ type: 'error', title, message });
  },
  success: (title: string, message?: string) => {
    return toast.show({ type: 'success', title, message });
  },
  warning: (title: string, message?: string) => {
    return toast.show({ type: 'warning', title, message });
  },
  info: (title: string, message?: string) => {
    return toast.show({ type: 'info', title, message });
  },
  dismiss: (id: string) => {
    toastsState = toastsState.filter((t) => t.id !== id);
    notifyListeners();
  },
  clear: () => {
    toastsState = [];
    notifyListeners();
  },
};

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const listener: ToastListener = (updated) => {
      setToasts(updated);
    };
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-label="Notifications"
      className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
    >
      {toasts.map((t) => {
        const isError = t.type === 'error';
        const isSuccess = t.type === 'success';
        const isWarning = t.type === 'warning';

        const borderColor = isError
          ? 'border-rose-500/40 bg-rose-950/90 text-rose-200'
          : isSuccess
          ? 'border-emerald-500/40 bg-emerald-950/90 text-emerald-200'
          : isWarning
          ? 'border-amber-500/40 bg-amber-950/90 text-amber-200'
          : 'border-sky-500/40 bg-slate-900/95 text-sky-200';

        const iconColor = isError
          ? 'text-rose-400'
          : isSuccess
          ? 'text-emerald-400'
          : isWarning
          ? 'text-amber-400'
          : 'text-sky-400';

        return (
          <div
            key={t.id}
            role="alert"
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${borderColor}`}
          >
            <div className={`shrink-0 mt-0.5 ${iconColor}`}>
              {isError && <AlertCircle className="w-5 h-5" />}
              {isSuccess && <CheckCircle2 className="w-5 h-5" />}
              {isWarning && <AlertTriangle className="w-5 h-5" />}
              {!isError && !isSuccess && !isWarning && <Info className="w-5 h-5" />}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <h4 className="text-xs font-bold tracking-tight text-slate-100">{t.title}</h4>
              {t.message && (
                <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed break-words">
                  {t.message}
                </p>
              )}
            </div>

            <button
              onClick={() => toast.dismiss(t.id)}
              className="shrink-0 p-1 text-slate-400 hover:text-slate-100 hover:bg-white/10 rounded transition-colors"
              title="Dismiss notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
