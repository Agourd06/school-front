import React from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import type { StudentReport, StudentReportStatus } from '../../api/studentReport';
import { StudentReportForm, type StudentReportFormData } from '../forms';
import type { SearchSelectOption } from '../inputs/SearchSelect';

export interface StudentReportFormValues {
  school_year_id: number | '';
  school_year_period_id: number | '';
  student_id: number | '';
  remarks: string;
  mention: string;
  passed: boolean;
  status: StudentReportStatus;
}

interface StudentReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StudentReport | null;
  onSubmit: (values: StudentReportFormValues) => Promise<void>;
  isSubmitting?: boolean;
  periodOptions: SearchSelectOption[];
  studentOptions: SearchSelectOption[];
  serverError?: string | null;
  presetValues?: Partial<StudentReportFormValues>;
  contextInfo?: {
    year?: string;
    period?: string;
    className?: string;
  };
  disableStudentSelect?: boolean;
  disablePeriodSelect?: boolean;
}

const StudentReportModal: React.FC<StudentReportModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  periodOptions,
  studentOptions,
  serverError,
  presetValues,
  contextInfo,
  disableStudentSelect = false,
  disablePeriodSelect = false,
}) => {
  const { t } = useTranslation();
  const handleSubmit = async (formData: StudentReportFormData) => {
    await onSubmit(formData as StudentReportFormValues);
  };

  // Convert API type to form type (null -> undefined)
  const formInitialData = initialData
    ? {
        ...initialData,
        remarks: initialData.remarks ?? undefined,
        mention: initialData.mention ?? undefined,
      }
    : undefined;

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('sections.editStudentReport') : t('forms.addStudentReport')}
      className="sm:max-w-4xl"
    >
      <StudentReportForm
        initialData={formInitialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
        periodOptions={periodOptions}
        studentOptions={studentOptions}
        presetValues={presetValues}
        contextInfo={contextInfo}
        disableStudentSelect={disableStudentSelect}
        disablePeriodSelect={disablePeriodSelect}
      />
    </BaseModal>
  );
};

export default StudentReportModal;
