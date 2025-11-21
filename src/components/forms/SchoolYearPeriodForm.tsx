import React, { useState, useEffect } from 'react';
import {
  validateRequired,
  validateDateOrder,
  validateSelectRequired,
} from '../modals/validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';

export interface SchoolYearPeriodFormData {
  title: string;
  start_date: string;
  end_date: string;
  status: number;
  schoolYearId: number | '';
  lifecycle_status: 'planned' | 'ongoing' | 'completed';
}

export interface SchoolYearPeriod {
  id: number;
  title: string;
  start_date: string;
  end_date: string;
  status: number;
  schoolYearId?: number;
  schoolYear?: { id: number; title: string; start_date?: string; end_date?: string };
  lifecycle_status?: 'planned' | 'ongoing' | 'completed';
}

interface SchoolYearPeriodFormProps {
  initialData?: SchoolYearPeriod | null;
  onSubmit: (data: SchoolYearPeriodFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  schoolYears: Array<{ id: number; title: string; start_date?: string; end_date?: string }>;
  selectedSchoolYear?: { id: number; title: string; start_date?: string; end_date?: string } | null;
  isSchoolYearLocked?: boolean;
  initialSchoolYearId?: number;
}

const formatDateWithMonthDay = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
};

const SchoolYearPeriodForm: React.FC<SchoolYearPeriodFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  schoolYears,
  selectedSchoolYear,
  isSchoolYearLocked = false,
  initialSchoolYearId,
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState<number>(1);
  const [schoolYearId, setSchoolYearId] = useState<number | ''>('');
  const [lifecycleStatus, setLifecycleStatus] = useState<'planned' | 'ongoing' | 'completed'>('planned');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setStartDate(initialData.start_date || '');
      setEndDate(initialData.end_date || '');
      setStatus(typeof initialData.status === 'number' ? initialData.status : 1);
      setSchoolYearId(initialData.schoolYearId || initialData.schoolYear?.id || '');
      setLifecycleStatus(initialData.lifecycle_status || 'planned');
    } else {
      setTitle('');
      setStartDate('');
      setEndDate('');
      setStatus(1);
      setSchoolYearId(initialSchoolYearId ?? '');
      setLifecycleStatus('planned');
    }
    setErrors({});
  }, [initialData, initialSchoolYearId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};
    const requiredTitle = validateRequired(title, 'Title');
    if (requiredTitle) newErrors.title = requiredTitle;
    const startReq = validateRequired(startDate, 'Start date');
    if (startReq) newErrors.start_date = startReq;
    const endReq = validateRequired(endDate, 'End date');
    if (endReq) newErrors.end_date = endReq;
    const dateOrder = validateDateOrder(startDate, endDate, {
      start: 'start date',
      end: 'end date',
    });
    if (!newErrors.start_date && !newErrors.end_date && dateOrder) newErrors.date = dateOrder;
    const yearReq = validateSelectRequired(schoolYearId, 'School year');
    if (yearReq) newErrors.schoolYearId = yearReq;

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    await onSubmit({
      title,
      start_date: startDate,
      end_date: endDate,
      status,
      schoolYearId,
      lifecycle_status: lifecycleStatus,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">School Year</label>
        {isSchoolYearLocked && (selectedSchoolYear || initialData?.schoolYear) ? (
          <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
            <div className="text-sm font-medium text-gray-900">
              {selectedSchoolYear?.title || initialData?.schoolYear?.title || 'N/A'}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {formatDateWithMonthDay(
                selectedSchoolYear?.start_date || initialData?.schoolYear?.start_date || ''
              )}{' '}
              - {formatDateWithMonthDay(selectedSchoolYear?.end_date || initialData?.schoolYear?.end_date || '')}
            </div>
          </div>
        ) : (
          <Select
            value={schoolYearId}
            onChange={(e) => setSchoolYearId(e.target.value ? Number(e.target.value) : '')}
            disabled={isSchoolYearLocked}
            options={[
              { value: '', label: 'Select a school year' },
              ...schoolYears.map((y) => ({
                value: y.id,
                label: y.title,
              })),
            ]}
            error={errors.schoolYearId}
            className={`shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              isSchoolYearLocked ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
        )}
      </div>

      <Input
        label="Title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        required
        error={errors.title}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          required
          error={errors.start_date}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          required
          error={errors.end_date || errors.date}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      <Select
        label="Lifecycle Status"
        value={lifecycleStatus}
        onChange={(e) => setLifecycleStatus(e.target.value as 'planned' | 'ongoing' | 'completed')}
        options={[
          { value: 'planned', label: 'Planned' },
          { value: 'ongoing', label: 'Ongoing' },
          { value: 'completed', label: 'Completed' },
        ]}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(Number(e.target.value))}
        options={STATUS_OPTIONS_FORM.map((option) => ({
          value: option.value,
          label: option.label,
        }))}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default SchoolYearPeriodForm;

