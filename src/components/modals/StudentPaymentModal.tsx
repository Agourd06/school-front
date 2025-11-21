import React from 'react';
import BaseModal from './BaseModal';
import type { StudentPayment, StudentPaymentStatus } from '../../api/studentPayment';
import { StudentPaymentForm, type StudentPaymentFormData } from '../forms';

export interface StudentPaymentFormValues {
  student_id: number | '';
  school_year_id: number | '';
  level_id: number | '';
  level_pricing_id: number | '';
  amount: string;
  payment: string;
  date: string;
  mode: string;
  reference: string;
  status: StudentPaymentStatus;
}

interface StudentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StudentPayment | null;
  onSubmit: (values: StudentPaymentFormValues) => Promise<void>;
  isSubmitting?: boolean;
  studentOptions: SearchSelectOption[];
  schoolYearOptions: SearchSelectOption[];
  levelOptions: SearchSelectOption[];
  levelPricingOptions: SearchSelectOption[];
  modeOptions?: string[];
  serverError?: string | null;
}

const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  studentOptions,
  schoolYearOptions,
  levelOptions,
  levelPricingOptions,
  modeOptions = ['Cash', 'Card', 'Transfer', 'Check'],
  serverError,
}) => {
  const handleSubmit = async (formData: StudentPaymentFormData) => {
    await onSubmit(formData as StudentPaymentFormValues);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Student Payment' : 'Add Student Payment'}
      className="sm:max-w-4xl"
    >
      <StudentPaymentForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
        studentOptions={studentOptions}
        schoolYearOptions={schoolYearOptions}
        levelOptions={levelOptions}
        levelPricingOptions={levelPricingOptions}
        modeOptions={modeOptions}
      />
    </BaseModal>
  );
};

export default StudentPaymentModal;
