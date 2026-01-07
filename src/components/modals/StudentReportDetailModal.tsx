import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import type { SearchSelectOption } from '../inputs/SearchSelect';
import type { StudentReportDetail as StudentReportDetailFromAPI, StudentReportDetailStatus } from '../../api/studentReportDetail';
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
  initialData?: StudentReportDetailFromAPI | null;
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
  const { t } = useTranslation();
  // Check if teacher/course are already set (from direct field or relation)
  const hasTeacherId = Boolean(initialData?.teacher_id ?? initialData?.teacher?.id);
  const hasCourseId = Boolean(initialData?.course_id ?? initialData?.course?.id);
  const disableTeacherSelect = hasTeacherId;
  const disableCourseSelect = hasCourseId;

  const handleSubmit = async (formData: StudentReportDetailFormData) => {
    await onSubmit(formData as StudentReportDetailFormValues);
  };

  // Memoize form initial data to prevent unnecessary re-renders and form resets
  const formInitialData = useMemo(() => {
    if (!initialData) return undefined;
    return {
      ...initialData,
      teacher_id: initialData.teacher_id ?? initialData.teacher?.id ?? undefined,
      course_id: initialData.course_id ?? initialData.course?.id ?? undefined,
      teacher: initialData.teacher ?? undefined,
      course: initialData.course ?? undefined,
    };
  }, [initialData?.id, initialData?.teacher_id, initialData?.teacher?.id, initialData?.course_id, initialData?.course?.id, initialData?.remarks, initialData?.note, initialData?.status]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('sections.editReportDetail') : t('forms.addDetail')}
      className="sm:max-w-4xl"
    >
      <StudentReportDetailForm
        initialData={formInitialData}
        reportId={reportId}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={isSubmitting}
        serverError={serverError}
        teacherOptions={teacherOptions}
        courseOptions={courseOptions}
        disableTeacherSelect={disableTeacherSelect}
        disableCourseSelect={disableCourseSelect}
      />
    </BaseModal>
  );
};

export default StudentReportDetailModal;
