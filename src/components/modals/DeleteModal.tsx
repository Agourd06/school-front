import React from 'react';
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
  title = 'Delete Item',
  message,
  entityName,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  const finalMessage = message ?? `Are you sure you want to delete${entityName ? ` "${entityName}"` : ''}? This action cannot be undone.`;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onCancel}
      title={title}
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
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            isLoading={isLoading}
            disabled={isLoading}
          >
            Delete
          </Button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteModal;

