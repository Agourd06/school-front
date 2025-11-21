import React from 'react';
import BaseModal from './BaseModal';
import { LevelPricingForm } from '../forms';
import type { LevelPricing, LevelPricingStatus } from '../../api/levelPricing';

export interface LevelPricingFormValues {
  level_id: number | '';
  title: string;
  amount: string;
  occurrences: string;
  every_month: boolean;
  status: LevelPricingStatus;
}

interface LevelPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: LevelPricing | null;
  onSubmit: (values: LevelPricingFormValues) => Promise<void>;
  isSubmitting?: boolean;
  levelOptions: SearchSelectOption[];
  serverError?: string | null;
}

const LevelPricingModal: React.FC<LevelPricingModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  levelOptions,
  serverError,
}) => {
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Level Pricing' : 'Add Level Pricing'}
      className="sm:max-w-3xl"
    >
      <LevelPricingForm
        initialData={initialData}
        onSubmit={onSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
        levelOptions={levelOptions}
      />
    </BaseModal>
  );
};

export default LevelPricingModal;

