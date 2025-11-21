import React from 'react';
import BaseModal from './BaseModal';
import type { PresenceValue, StudentPresence, StudentPresenceStatus } from '../../api/studentPresence';
import { StudentPresenceForm, type StudentPresenceFormData } from '../forms';

export interface StudentPresenceFormValues {
  student_planning_id: number | '';
  student_id: number | '';
  presence: PresenceValue;
  note: string;
  remarks: string;
  status: StudentPresenceStatus;
}

interface StudentPresenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StudentPresence | null;
  onSubmit: (values: StudentPresenceFormValues) => Promise<void>;
  isSubmitting?: boolean;
  planningOptions: SearchSelectOption[];
  studentOptions: SearchSelectOption[];
  serverError?: string | null;
}

const StudentPresenceModal: React.FC<StudentPresenceModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  planningOptions,
  studentOptions,
  serverError,
}) => {
  const handleSubmit = async (formData: StudentPresenceFormData) => {
    await onSubmit(formData as StudentPresenceFormValues);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Student Presence' : 'Add Student Presence'}
      className="sm:max-w-4xl"
    >
      <StudentPresenceForm
        initialData={initialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
        planningOptions={planningOptions}
        studentOptions={studentOptions}
      />
    </BaseModal>
  );
};

export default StudentPresenceModal;
