import React from 'react';
import BaseModal from './BaseModal';

interface DescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  type:
    | 'program'
    | 'specialization'
    | 'course'
    | 'module'
    | 'student link type'
    | 'student diplome'
    | 'student contact'
    | 'level'
    | 'class';
}

const DescriptionModal: React.FC<DescriptionModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  type
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`${type.charAt(0).toUpperCase() + type.slice(1)} Description${title ? `: ${title}` : ''}`}
    >
      <div className="space-y-4">
        <div>
          {!!title && (
            <>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {type.charAt(0).toUpperCase() + type.slice(1)} Title
              </h3>
              <p className="text-gray-700">{title}</p>
            </>
          )}
        </div>
        
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
          <div 
            className="prose max-w-none text-gray-700 border border-gray-200 rounded-lg p-4 bg-gray-50 max-h-96 overflow-y-auto"
            dangerouslySetInnerHTML={{ 
              __html: description || '<p class="text-gray-500 italic">No description available</p>' 
            }}
          />
        </div>
      </div>
    </BaseModal>
  );
};

export default DescriptionModal;
