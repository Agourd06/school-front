import { useState, useCallback } from 'react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertState {
  isOpen: boolean;
  message: string;
  type: AlertType;
  title?: string;
  confirmText?: string;
}

export const useAlert = () => {
  const [alert, setAlert] = useState<AlertState>({
    isOpen: false,
    message: '',
    type: 'info',
  });

  const showAlert = useCallback((
    message: string,
    type: AlertType = 'info',
    title?: string,
    confirmText?: string
  ) => {
    setAlert({
      isOpen: true,
      message,
      type,
      title,
      confirmText,
    });
  }, []);

  const closeAlert = useCallback(() => {
    setAlert((prev) => ({ ...prev, isOpen: false }));
  }, []);

  return {
    alert,
    showAlert,
    closeAlert,
  };
};
