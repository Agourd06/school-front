import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateSchoolYear, useUpdateSchoolYear, useSchoolYears } from '../../hooks/useSchoolYears';
import BaseModal from './BaseModal';
import { SchoolYearForm } from '../forms';
import type { SchoolYear } from '../../api/schoolYear';

interface SchoolYearModalProps {
  isOpen: boolean;
  onClose: () => void;
  schoolYear?: SchoolYear | null;
}

const SchoolYearModal: React.FC<SchoolYearModalProps> = ({ isOpen, onClose, schoolYear }) => {
  const { t } = useTranslation();
  const createSchoolYear = useCreateSchoolYear();
  const updateSchoolYear = useUpdateSchoolYear();
  const [serverError, setServerError] = useState<string | null>(null);
  const [ongoingWarning, setOngoingWarning] = useState<string | null>(null);

  // Fetch ongoing years for validation
  const { data: ongoingYearsData } = useSchoolYears({ lifecycle_status: 'ongoing', limit: 100 });
  const ongoingYears = ongoingYearsData?.data ?? [];

  const isEditing = !!schoolYear;

  const handleSubmit = async (formData: {
    title: string;
    start_date: string;
    end_date: string;
    status: number;
    lifecycle_status: 'planned' | 'ongoing' | 'completed';
  }) => {
    setServerError(null);
    setOngoingWarning(null);

    const payload = {
      title: formData.title.trim(),
      start_date: formData.start_date,
      end_date: formData.end_date,
      status: Number(formData.status),
      lifecycle_status: formData.lifecycle_status,
    };

    try {
      // Check for ongoing conflicts if setting to ongoing
      if (formData.lifecycle_status === 'ongoing') {
        const otherOngoingYear = ongoingYears.find((year) => year.id !== schoolYear?.id);
        if (otherOngoingYear) {
          setServerError('There must be at most one ongoing school year. Another school year is already ongoing.');
          return;
        }
      }

      // Check if changing the only ongoing year to another status
      if (isEditing && schoolYear && schoolYear.lifecycle_status === 'ongoing' && formData.lifecycle_status !== 'ongoing') {
        const isOnlyOngoing = ongoingYears.length === 1 && ongoingYears[0].id === schoolYear.id;
        if (isOnlyOngoing) {
          setOngoingWarning('Warning: This is the only ongoing school year. After this change, there will be no ongoing school years. It is recommended to have one ongoing school year.');
          // Continue with submission (warning is informational, not blocking)
        }
      }

      if (isEditing && schoolYear) {
        await updateSchoolYear.mutateAsync({
          id: schoolYear.id,
          ...payload,
        });
      } else {
        await createSchoolYear.mutateAsync(payload);
      }
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const dataMessage = axiosError?.response?.data?.message;
      let errorMessage = 'An error occurred while saving the school year.';
      
      if (Array.isArray(dataMessage)) {
        errorMessage = dataMessage.join(', ');
      } else if (typeof dataMessage === 'string') {
        errorMessage = dataMessage;
      } else if (typeof axiosError.message === 'string') {
        errorMessage = axiosError.message;
      }
      
      setServerError(errorMessage);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('sections.editSchoolYear') : t('sections.addSchoolYear')}
    >
      <SchoolYearForm
        initialData={schoolYear}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createSchoolYear.isPending || updateSchoolYear.isPending}
        isOpen={isOpen}
        serverError={serverError}
        ongoingWarning={ongoingWarning}
        onDismissWarning={() => setOngoingWarning(null)}
      />
    </BaseModal>
  );
};

export default SchoolYearModal;
