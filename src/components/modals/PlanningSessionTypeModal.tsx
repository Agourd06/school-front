import React from 'react';
import BaseModal from './BaseModal';
import { PlanningSessionTypeForm } from '../forms';
import type { PlanningSessionType, PlanningSessionTypeStatus } from '../../api/planningSessionType';

export interface PlanningSessionTypeFormValues {
  title: string;
  type: string;
  coefficient?: number | null;
  status: PlanningSessionTypeStatus;
}

interface PlanningSessionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PlanningSessionType | null;
  onSubmit: (values: PlanningSessionTypeFormValues) => Promise<void>;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const PlanningSessionTypeModal: React.FC<PlanningSessionTypeModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  serverError,
}) => {
  const handleSubmit = async (formData: PlanningSessionTypeFormValues) => {
    await onSubmit({
      ...formData,
      title: formData.title.trim(),
      type: formData.type.trim(),
      coefficient:
        formData.coefficient === null || formData.coefficient === undefined || Number.isNaN(Number(formData.coefficient))
          ? null
          : Number(formData.coefficient),
    });
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Planning Session Type' : 'Add Planning Session Type'}
      className="sm:max-w-lg"
    >
      <PlanningSessionTypeForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
      />
    </BaseModal>
  );
};

export default PlanningSessionTypeModal;


