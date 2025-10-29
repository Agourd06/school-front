import React from 'react';
import type { ReactNode } from 'react';

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

const BaseModal: React.FC<BaseModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-gray-600 bg-opacity-50 ">
      <div className="absolute inset-0 p-2 sm:p-4 flex items-center justify-center">
        <div className="w-[96vw] max-w-none bg-white border rounded-md shadow-lg p-4 sm:p-6 max-h-[92vh] overflow-y-auto">
          <div className="mt-1">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-medium text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BaseModal;

