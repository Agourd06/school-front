import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import RichTextEditor from '../inputs/RichTextEditor';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import type { StudentReportDetailStatus } from '../../api/studentReportDetail';

export interface StudentReportDetailFormData {
  student_report_id: number;
  teacher_id: number | '';
  course_id: number | '';
  remarks: string;
  note: number | '';
  status: StudentReportDetailStatus;
}

// Re-export the API type for compatibility
export type { StudentReportDetail as StudentReportDetailFromAPI } from '../../api/studentReportDetail';

export interface StudentReportDetail {
  id: number;
  student_report_id: number;
  teacher_id?: number;
  course_id?: number;
  remarks?: string | null;
  note?: number | string | null;
  status: StudentReportDetailStatus;
  teacher?: { id: number; first_name?: string | null; last_name?: string | null; email?: string | null } | null;
  course?: { id: number; title?: string | null; code?: string | null } | null;
}

const statusOptionsSelect = STATUS_OPTIONS_FORM.map((opt) => ({ value: opt.value, label: opt.label }));

interface StudentReportDetailFormProps {
  initialData?: StudentReportDetail | null;
  reportId: number;
  onSubmit: (data: StudentReportDetailFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  teacherOptions: SearchSelectOption[];
  courseOptions: SearchSelectOption[];
  disableTeacherSelect?: boolean;
  disableCourseSelect?: boolean;
}

const StudentReportDetailForm: React.FC<StudentReportDetailFormProps> = ({
  initialData,
  reportId,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  teacherOptions,
  courseOptions,
  disableTeacherSelect = false,
  disableCourseSelect = false,
}) => {
  const { t } = useTranslation();
  // Track the initial data ID to prevent unnecessary resets
  const initialDataIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  const [form, setForm] = useState<StudentReportDetailFormData>({
    student_report_id: reportId,
    teacher_id: '',
    course_id: '',
    remarks: '',
    note: '',
    status: 2,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    // Get the current initialData ID (or null if no initialData)
    const currentInitialDataId = initialData?.id ?? null;
    
    // Only reset form if:
    // 1. We haven't initialized yet, OR
    // 2. The initialData ID has changed (different record being edited)
    const shouldReset = !isInitializedRef.current || initialDataIdRef.current !== currentInitialDataId;

    if (shouldReset) {
      if (initialData) {
        const normalizedStatus = statusOptionsSelect.some((opt) => opt.value === initialData.status)
          ? initialData.status
          : 2;
        // Convert note to number or empty string
        const normalizedNote: number | '' = 
          initialData.note === null || initialData.note === undefined
            ? ''
            : typeof initialData.note === 'string'
            ? initialData.note === '' ? '' : Number(initialData.note) || ''
            : initialData.note;
        // Extract teacher_id from teacher_id field or teacher relation
        // Handle null, undefined, and ensure it's a number when present
        let teacherId: number | '' = '';
        if (initialData.teacher_id !== null && initialData.teacher_id !== undefined) {
          teacherId = Number(initialData.teacher_id);
        } else if (initialData.teacher?.id !== null && initialData.teacher?.id !== undefined) {
          teacherId = Number(initialData.teacher.id);
        }
        
        // Extract course_id from course_id field or course relation
        let courseId: number | '' = '';
        if (initialData.course_id !== null && initialData.course_id !== undefined) {
          courseId = Number(initialData.course_id);
        } else if (initialData.course?.id !== null && initialData.course?.id !== undefined) {
          courseId = Number(initialData.course.id);
        }
        setForm({
          student_report_id: initialData.student_report_id,
          teacher_id: teacherId,
          course_id: courseId,
          remarks: initialData.remarks ?? '',
          note: normalizedNote,
          status: normalizedStatus,
        });
      } else {
        setForm({
          student_report_id: reportId,
          teacher_id: '',
          course_id: '',
          remarks: '',
          note: '',
          status: 2,
        });
      }
      setErrors({});
      
      // Update refs
      initialDataIdRef.current = currentInitialDataId;
      isInitializedRef.current = true;
    }

    // Reset refs when initialData becomes null/undefined (modal closed)
    if (!initialData && isInitializedRef.current) {
      initialDataIdRef.current = null;
      isInitializedRef.current = false;
    }
  }, [initialData, reportId]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.note !== '' && Number.isNaN(Number(form.note))) e.note = t('forms.noteMustBeNumber');
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectChange = (field: 'teacher_id' | 'course_id') => (value: number | '' | string) => {
    const normalizedValue: number | '' = value === '' || value === null || value === undefined ? '' : Number(value);
    setForm((prev) => ({
      ...prev,
      [field]: normalizedValue,
    }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <SearchSelect
          label={t('sections.teacher')}
          value={form.teacher_id}
          onChange={handleSelectChange('teacher_id')}
          options={teacherOptions}
          placeholder={t('forms.selectTeacher')}
          disabled={disableTeacherSelect}
        />
        <SearchSelect
          label={t('sections.course')}
          value={form.course_id}
          onChange={handleSelectChange('course_id')}
          options={courseOptions}
          placeholder={t('forms.selectCourse')}
          disabled={disableCourseSelect}
        />
        <Select
          label={t('common.status')}
          value={form.status}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, status: Number(e.target.value) as StudentReportDetailStatus }))
          }
          options={statusOptionsSelect.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <Input
        label={t('sections.note')}
        type="number"
        value={form.note}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            note: e.target.value === '' ? '' : Number(e.target.value),
          }))
        }
        placeholder={t('forms.optionalNote')}
        error={errors.note}
        className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />
      <div>
        <label className="block text-sm font-medium text-heading mb-2">{t('sections.remarks')}</label>
        <RichTextEditor
          value={form.remarks}
          onChange={(content) => setForm((prev) => ({ ...prev, remarks: content }))}
          placeholder={t('forms.optionalRemarks')}
          rows={8}
        />
      </div>

      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? t('forms.updateDetail') : t('forms.createDetail')}
        </Button>
      </div>
    </form>
  );
};

export default StudentReportDetailForm;

