import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import type { StudentReport, StudentReportStatus } from '../../api/studentReport';
import RichTextEditor from '../inputs/RichTextEditor';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Button } from '../ui';

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

const DEFAULT_FORM: StudentReportFormValues = {
  school_year_id: '',
  school_year_period_id: '',
  student_id: '',
  remarks: '',
  mention: '',
  passed: false,
  status: 2,
};

const statusOptionsSelect = STATUS_OPTIONS_FORM.map((opt) => ({ value: opt.value, label: opt.label }));

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
  const [form, setForm] = useState<StudentReportFormValues>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const normalizedStatus = statusOptionsSelect.some((opt) => opt.value === initialData.status)
        ? initialData.status
        : 2;
      setForm({
        school_year_period_id: initialData.school_year_period_id ?? '',
        student_id: initialData.student_id ?? '',
        school_year_id: initialData.school_year_id ?? '',
        remarks: initialData.remarks ?? '',
        mention: initialData.mention ?? '',
        passed: !!initialData.passed,
        status: normalizedStatus,
      });
    } else {
      setForm({
        ...DEFAULT_FORM,
        ...presetValues,
      });
    }
    setErrors({});
  }, [initialData, isOpen, presetValues]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.school_year_period_id === '' || form.school_year_period_id === null) {
      e.school_year_period_id = 'Period is required';
    }
    if (form.student_id === '' || form.student_id === null) {
      e.student_id = 'Student is required';
    }
    if (form.school_year_id === '' || form.school_year_id === null) {
      e.school_year_id = 'School year is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectChange = (field: keyof StudentReportFormValues) => (value: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  const periodValue = useMemo(() => form.school_year_period_id ?? '', [form.school_year_period_id]);
  const studentValue = useMemo(() => form.student_id ?? '', [form.student_id]);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Student Report' : 'Add Student Report'}
      className="sm:max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {contextInfo && (
          <div className="rounded-lg border border-blue-100 bg-blue-50/60 px-3 py-2 text-xs text-blue-700 space-x-2 flex flex-wrap gap-2">
            {contextInfo.year && <span className="font-semibold">Year:</span>}
            {contextInfo.year && <span>{contextInfo.year}</span>}
            {contextInfo.period && (
              <>
                <span className="font-semibold">Period:</span>
                <span>{contextInfo.period}</span>
              </>
            )}
            {contextInfo.className && (
              <>
                <span className="font-semibold">Class:</span>
                <span>{contextInfo.className}</span>
              </>
            )}
          </div>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SearchSelect
            label="School Year Period"
            value={periodValue}
            onChange={handleSelectChange('school_year_period_id')}
            options={periodOptions}
            placeholder="Select period"
            error={errors.school_year_period_id}
            disabled={disablePeriodSelect}
          />
          <SearchSelect
            label="Student"
            value={studentValue}
            onChange={handleSelectChange('student_id')}
            options={studentOptions}
            placeholder="Select student"
            error={errors.student_id}
            disabled={disableStudentSelect}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div className="xl:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Mention</label>
            <input
              type="text"
              value={form.mention}
              onChange={(e) => setForm((prev) => ({ ...prev, mention: e.target.value }))}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Optional mention (e.g. Très Bien)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm((prev) => ({ ...prev, status: Number(e.target.value) as StudentReportStatus }))}
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
            placeholder="Optional notes about the student's progress"
            rows={10}
          />
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <input
              type="checkbox"
              checked={form.passed}
              onChange={(e) => setForm((prev) => ({ ...prev, passed: e.target.checked }))}
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Passed
          </label>
          {serverError && (
            <p className="text-sm text-red-600">
              {serverError}
            </p>
          )}
        </div>

        <div className="flex justify-end space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {initialData ? 'Update Report' : 'Create Report'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentReportModal;


