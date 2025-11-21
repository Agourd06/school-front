import React, { useState, useEffect } from 'react';
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

export interface StudentReportDetail {
  id: number;
  student_report_id: number;
  teacher_id?: number;
  course_id?: number;
  remarks?: string;
  note?: number | string;
  status: StudentReportDetailStatus;
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
}) => {
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
  }, [initialData, reportId]);

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
        <Select
          label="Status"
          value={form.status}
          onChange={(e) =>
            setForm((prev) => ({ ...prev, status: Number(e.target.value) as StudentReportDetailStatus }))
          }
          options={statusOptionsSelect.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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
      <Input
        label="Note"
        type="number"
        value={form.note}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            note: e.target.value === '' ? '' : Number(e.target.value),
          }))
        }
        placeholder="Optional note"
        error={errors.note}
        className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update Detail' : 'Create Detail'}
        </Button>
      </div>
    </form>
  );
};

export default StudentReportDetailForm;

