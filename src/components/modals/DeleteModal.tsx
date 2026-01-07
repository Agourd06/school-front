import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { Button } from '../ui';

interface DeleteModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  entityName?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const DeleteModal: React.FC<DeleteModalProps> = ({
  isOpen,
  title,
  message,
  entityName,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const { t } = useTranslation();
  const defaultTitle = title ?? t('modals.delete');
  const entityNameText = entityName ? ` "${entityName}"` : '';
  const finalMessage = message ?? t('modals.confirmDeleteMessage').replace('{{entityName}}', entityNameText);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={defaultTitle}
      className="sm:max-w-md"
      contentClassName="p-5"
    >
      <div className="space-y-5 text-center">
        <p className="text-sm text-gray-600">{finalMessage}</p>
        <div className="flex justify-center space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            {t('common.delete')}
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteModal;

