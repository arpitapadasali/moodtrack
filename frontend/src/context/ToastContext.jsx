import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';

export const ToastContext = createContext({
  showToast: () => {},
  success: () => {},
  error: () => {},
  info: () => {},
  warning: () => {},
  dismissToast: () => {}
});

/**
 * Toast Notification Provider
 * Manages floating, accessible notifications with automatic dismissal,
 * manual close controls, and distinct visual themes for success, error, warning, and info.
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, type = 'success', duration = 4000) => {
    if (!message) return;
    const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }
    return id;
  }, [dismissToast]);

  const success = useCallback((msg, duration) => showToast(msg, 'success', duration), [showToast]);
  const error = useCallback((msg, duration) => showToast(msg, 'error', duration), [showToast]);
  const info = useCallback((msg, duration) => showToast(msg, 'info', duration), [showToast]);
  const warning = useCallback((msg, duration) => showToast(msg, 'warning', duration), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, info, warning, dismissToast }}>
      {children}

      {/* Floating Accessible Toast Container */}
      <div
        className="fixed bottom-5 right-5 z-50 flex flex-col space-y-2 pointer-events-none max-w-sm w-full sm:w-auto px-4 sm:px-0"
        aria-live="polite"
        aria-atomic="true"
        role="region"
        aria-label="Notifications"
      >
        {toasts.map((toast) => {
          const isError = toast.type === 'error';
          const isWarning = toast.type === 'warning';
          const isInfo = toast.type === 'info';

          let bgClasses = 'bg-emerald-50 border-emerald-200 text-emerald-900';
          let Icon = CheckCircle2;
          let iconColor = 'text-emerald-600';

          if (isError) {
            bgClasses = 'bg-rose-50 border-rose-200 text-rose-900';
            Icon = AlertCircle;
            iconColor = 'text-rose-600';
          } else if (isWarning) {
            bgClasses = 'bg-amber-50 border-amber-200 text-amber-900';
            Icon = AlertTriangle;
            iconColor = 'text-amber-600';
          } else if (isInfo) {
            bgClasses = 'bg-sky-50 border-sky-200 text-sky-900';
            Icon = Info;
            iconColor = 'text-sky-600';
          }

          return (
            <div
              key={toast.id}
              role={isError ? 'alert' : 'status'}
              className={`pointer-events-auto flex items-start justify-between gap-3 p-3.5 sm:p-4 rounded-xl border shadow-lg backdrop-blur-xs transition-all duration-200 animate-in fade-in slide-in-from-bottom-3 ${bgClasses}`}
            >
              <div className="flex items-start space-x-2.5 min-w-0">
                <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${iconColor}`} />
                <p className="text-xs sm:text-sm font-medium leading-snug break-words">
                  {toast.message}
                </p>
              </div>

              <button
                type="button"
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition shrink-0 cursor-pointer -mr-1 -mt-1"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
