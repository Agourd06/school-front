import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import type { StudentReportDetail, StudentReportDetailStatus } from '../../api/studentReportDetail';
import RichTextEditor from '../inputs/RichTextEditor';
import { STATUS_OPTIONS_FORM } from '../../constants/status';

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

const statusOptionsSelect = STATUS_OPTIONS_FORM.map((opt) => ({ value: opt.value, label: opt.label }));

const DEFAULT_FORM = (reportId: number): StudentReportDetailFormValues => ({
  student_report_id: reportId,
  teacher_id: '',
  course_id: '',
  remarks: '',
  note: '',
  status: 2,
});

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
  const [form, setForm] = useState<StudentReportDetailFormValues>(DEFAULT_FORM(reportId));
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const normalizedStatus = statusOptionsSelect.some((opt) => opt.value === initialData.status)
        ? initialData.status
        : 2;
      setForm({
        student_report_id: initialData.student_report_id,
        teacher_id: initialData.teacher_id ?? '',
        course_id: initialData.course_id ?? '',
        remarks: initialData.remarks ?? '',
        note: initialData.note ?? '',
        status: normalizedStatus,
      });
    } else {
      setForm(DEFAULT_FORM(reportId));
    }
    setErrors({});
  }, [initialData, reportId, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.teacher_id === '' || form.teacher_id === null) e.teacher_id = 'Teacher is required';
    if (form.course_id === '' || form.course_id === null) e.course_id = 'Course is required';
    if (form.note !== '' && Number.isNaN(Number(form.note))) e.note = 'Note must be a number';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectChange = (field: 'teacher_id' | 'course_id') => (value: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
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
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Report Detail' : 'Add Report Detail'}
      className="sm:max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SearchSelect
            label="Teacher"
            value={form.teacher_id}
            onChange={handleSelectChange('teacher_id')}
            options={teacherOptions}
            placeholder="Select teacher"
            error={errors.teacher_id}
          />
          <SearchSelect
            label="Course"
            value={form.course_id}
            onChange={handleSelectChange('course_id')}
            options={courseOptions}
            placeholder="Select course"
            error={errors.course_id}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, status: Number(e.target.value) as StudentReportDetailStatus }))
              }
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptionsSelect.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Remarks</label>
          <RichTextEditor
            value={form.remarks}
            onChange={(content) => setForm((prev) => ({ ...prev, remarks: content }))}
            placeholder="Optional remarks"
            rows={8}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <input
            type="number"
            value={form.note}
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                note: e.target.value === '' ? '' : Number(e.target.value),
              }))
            }
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional note"
          />
          {errors.note && <p className="mt-1 text-xs text-red-600">{errors.note}</p>}
        </div>

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-60"
          >
            {isSubmitting ? 'Saving…' : initialData ? 'Update Detail' : 'Create Detail'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentReportDetailModal;


