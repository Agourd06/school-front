import React from 'react';
import BaseModal from './BaseModal';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import type { StudentReportDetail, StudentReportDetailStatus } from '../../api/studentReportDetail';
import { StudentReportDetailForm, type StudentReportDetailFormData } from '../forms';

export interface StudentReportDetailFormValues {
  student_report_id: number;
  teacher_id: number | '';
  course_id: number | '';
  remarks: string;
  note: number | '';
  status: StudentReportDetailStatus;
}

interface StudentReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StudentReportDetail | null;
  reportId: number;
  onSubmit: (values: StudentReportDetailFormValues) => Promise<void>;
  isSubmitting?: boolean;
  teacherOptions: SearchSelectOption[];
  courseOptions: SearchSelectOption[];
  serverError?: string | null;
}

const StudentReportDetailModal: React.FC<StudentReportDetailModalProps> = ({
  isOpen,
  onClose,
  initialData,
  reportId,
  onSubmit,
  isSubmitting,
  teacherOptions,
  courseOptions,
  serverError,
}) => {
  const handleSubmit = async (formData: StudentReportDetailFormData) => {
    await onSubmit(formData as StudentReportDetailFormValues);
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Report Detail' : 'Add Report Detail'}
      className="sm:max-w-4xl"
    >
      <StudentReportDetailForm
        initialData={initialData}
        reportId={reportId}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
        teacherOptions={teacherOptions}
        courseOptions={courseOptions}
      />
    </BaseModal>
  );
};

export default StudentReportDetailModal;
