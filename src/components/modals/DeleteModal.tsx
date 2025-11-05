import React from 'react';
import BaseModal from './BaseModal';

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
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-60"
            disabled={isLoading}
          >
            {isLoading ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      </div>
    </BaseModal>
  );
};

export default DeleteModal;

