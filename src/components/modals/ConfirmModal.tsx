import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { Button } from '../ui';
import { AlertCircle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'primary' | 'danger' | 'secondary';
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText,
  cancelText,
  confirmVariant = 'primary',
}) => {
  const { t } = useTranslation();

  const defaultTitle = title || t('common.confirm') || 'Confirm';
  const defaultConfirmText = confirmText || t('common.ok') || 'OK';
  const defaultCancelText = cancelText || t('common.cancel') || 'Cancel';

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={defaultTitle}
      className="sm:max-w-md"
      contentClassName="p-5"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-yellow-600" />
          <p className="text-sm text-gray-700 flex-1">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
          >
            {defaultCancelText}
          </Button>
          <Button
            type="button"
            variant={confirmVariant}
            onClick={onConfirm}
          >
            {defaultConfirmText}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ConfirmModal;
