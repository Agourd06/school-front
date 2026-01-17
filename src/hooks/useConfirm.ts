import { useState, useCallback } from 'react';

interface ConfirmState {
  isOpen: boolean;
  message: string;
  title?: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'secondary';
  onConfirm?: () => void;
}

export const useConfirm = () => {
  const [confirm, setConfirm] = useState<ConfirmState>({
    isOpen: false,
    message: '',
  });

  const showConfirm = useCallback((
    message: string,
    onConfirm: () => void,
    options?: {
      title?: string;
      confirmText?: string;
      cancelText?: string;
      confirmVariant?: 'primary' | 'danger' | 'secondary';
    }
  ) => {
    setConfirm({
      isOpen: true,
      message,
      title: options?.title,
      confirmText: options?.confirmText,
      cancelText: options?.cancelText,
      confirmVariant: options?.confirmVariant || 'primary',
      onConfirm: () => {
        onConfirm();
        closeConfirm();
      },
    });
  }, []);

  const closeConfirm = useCallback(() => {
    setConfirm((prev) => ({ ...prev, isOpen: false, onConfirm: undefined }));
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirm.onConfirm) {
      confirm.onConfirm();
    }
    closeConfirm();
  }, [confirm.onConfirm, closeConfirm]);

  return {
    confirm,
    showConfirm,
    closeConfirm,
    handleConfirm,
  };
};
