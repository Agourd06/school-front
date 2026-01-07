import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { LevelPricingForm } from '../forms';
import type { LevelPricing, LevelPricingStatus } from '../../api/levelPricing';
import type { SearchSelectOption } from '../inputs/SearchSelect';

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
  const { t } = useTranslation();
  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('forms.editLevelPricing') : t('forms.addLevelPricing')}
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

