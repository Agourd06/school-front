import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { Button } from '../ui';
import { AlertCircle, Info, CheckCircle2, XCircle } from 'lucide-react';

export type AlertType = 'info' | 'success' | 'warning' | 'error';

interface AlertModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  type?: AlertType;
  onClose: () => void;
  confirmText?: string;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
  confirmText,
}) => {
  const { t } = useTranslation();

  const icons = {
    info: Info,
    success: CheckCircle2,
    warning: AlertCircle,
    error: XCircle,
  };

  const iconColors = {
    info: 'text-blue-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    error: 'text-red-600',
  };

  const Icon = icons[type];
  const iconColor = iconColors[type];

  const defaultTitle = title || (type === 'error' ? t('common.error') || 'Error' : 
                                 type === 'success' ? t('common.success') || 'Success' :
                                 type === 'warning' ? t('common.warning') || 'Warning' :
                                 t('common.info') || 'Information');

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={defaultTitle}
      className="sm:max-w-md"
      contentClassName="p-5"
    >
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <Icon className={`w-6 h-6 flex-shrink-0 mt-0.5 ${iconColor}`} />
          <p className="text-sm text-gray-700 flex-1">{message}</p>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            variant="primary"
            onClick={onClose}
          >
            {confirmText || t('common.ok') || 'OK'}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default AlertModal;
