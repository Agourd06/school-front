import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { Button } from '../ui';
import { AlertTriangle } from 'lucide-react';

interface ValidationConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isPending?: boolean;
}

const ValidationConfirmationModal: React.FC<ValidationConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isPending = false,
}) => {
  const { t } = useTranslation();
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
      className="sm:max-w-md"
      contentClassName="p-5"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <AlertTriangle className="w-6 h-6 flex-shrink-0 mt-0.5 text-amber-600" aria-hidden />
          <p className="text-sm text-gray-700 flex-1">{message}</p>
        </div>
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onCancel} disabled={isPending}>
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending ? (t('common.loading') ?? 'Loading...') : t('common.confirm')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default ValidationConfirmationModal;
