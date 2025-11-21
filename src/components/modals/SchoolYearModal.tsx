import React from 'react';
import { useCreateSchoolYear, useUpdateSchoolYear } from '../../hooks/useSchoolYears';
import BaseModal from './BaseModal';
import { SchoolYearForm } from '../forms';
import type { SchoolYear } from '../../api/schoolYear';

interface SchoolYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolYear?: SchoolYear | null;
}

const SchoolYearModal: React.FC<SchoolYearModalProps> = ({ isOpen, onClose, schoolYear }) => {
  const createSchoolYear = useCreateSchoolYear();
  const updateSchoolYear = useUpdateSchoolYear();

  const isEditing = !!schoolYear;

  const handleSubmit = async (formData: {
    title: string;
    start_date: string;
    end_date: string;
    status: number;
    lifecycle_status: 'planned' | 'ongoing' | 'completed';
  }) => {
    const payload = {
      title: formData.title.trim(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: Number(formData.status),
      lifecycle_status: formData.lifecycle_status,
    };

    if (isEditing && schoolYear) {
      await updateSchoolYear.mutateAsync({
        id: schoolYear.id,
        ...payload,
      });
    } else {
      await createSchoolYear.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit School Year' : 'Add School Year'}
    >
      <SchoolYearForm
        initialData={schoolYear}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createSchoolYear.isPending || updateSchoolYear.isPending}
        isOpen={isOpen}
      />
    </BaseModal>
  );
};

export default SchoolYearModal;
