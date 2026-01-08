import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  type: ToastType;
  message: string;
  onDismiss: (id: string) => void;
  undoAction?: () => void;
  duration?: number;
}

const Toast: React.FC<ToastProps> = ({ id, type, message, onDismiss, undoAction, duration = 3000 }) => {
  const { t } = useTranslation();
  
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const icons = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertCircle,
    info: Info,
  };

  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  const Icon = icons[type];

  return (
    <div
      className={`flex items-start gap-3 rounded-lg border p-4 shadow-lg min-w-[300px] max-w-md animate-in slide-in-from-bottom-5 ${styles[type]}`}
      role="alert"
    >
      <Icon className="w-5 h-5 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        {undoAction && (
          <button
            type="button"
            onClick={undoAction}
            className="mt-2 text-xs font-semibold underline hover:no-underline"
          >
            {t('forms.undo')}
          </button>
        )}
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="flex-shrink-0 text-current opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

interface ToastContainerProps {
  toasts: Array<{ id: string; type: ToastType; message: string; undoAction?: () => void }>;
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          type={toast.type}
          message={toast.message}
          onDismiss={onDismiss}
          undoAction={toast.undoAction}
        />
      ))}
    </div>
  );
};

export default Toast;

