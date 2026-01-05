import React, { useState, useEffect, useRef } from 'react';
import { validateRequired, validateDateOrder } from '../modals/validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import type { SchoolYear } from '../../api/schoolYear';

export interface SchoolYearFormData {
  title: string;
  start_date: string;
  end_date: string;
  status: number;
  lifecycle_status: 'planned' | 'ongoing' | 'completed';
}

interface SchoolYearFormProps {
  initialData?: SchoolYear | null;
  onSubmit: (data: SchoolYearFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  isOpen?: boolean;
  ongoingWarning?: string | null;
  onDismissWarning?: () => void;
}

const SchoolYearForm: React.FC<SchoolYearFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  isOpen = true,
  ongoingWarning,
  onDismissWarning,
}) => {
  const [formData, setFormData] = useState<SchoolYearFormData>({
    title: '',
    start_date: '',
    end_date: '',
    status: 1,
    lifecycle_status: 'planned',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const schoolYearIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      schoolYearIdRef.current = null;
      isInitializedRef.current = false;
      return;
    }

    const currentId = initialData?.id ?? null;
    if (!isInitializedRef.current || currentId !== schoolYearIdRef.current) {
      schoolYearIdRef.current = currentId;
      isInitializedRef.current = true;

      if (initialData) {
        setFormData({
          title: initialData.title || '',
          start_date: initialData.start_date || '',
          end_date: initialData.end_date || '',
          status: initialData.status || 1,
          lifecycle_status: (initialData.lifecycle_status || 'planned') as 'planned' | 'ongoing' | 'completed',
        });
      } else {
        setFormData({
          title: '',
          start_date: '',
          end_date: '',
          status: 1,
          lifecycle_status: 'planned',
        });
      }
      setErrors({});
    }
  }, [initialData, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const titleErr = validateRequired(formData.title, 'Title');
    if (titleErr) newErrors.title = titleErr;
    const startErr = validateRequired(formData.start_date, 'Start date');
    if (startErr) newErrors.start_date = startErr;
    const endErr = validateRequired(formData.end_date, 'End date');
    if (endErr) newErrors.end_date = endErr;
    const orderErr = validateDateOrder(formData.start_date, formData.end_date, {
      start: 'start date',
      end: 'end date',
    });
    if (!newErrors.start_date && !newErrors.end_date && orderErr) newErrors.end_date = orderErr;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('SchoolYear form submission failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const newValue =
      name === 'status'
        ? Number(value)
        : name === 'lifecycle_status'
        ? (value as 'planned' | 'ongoing' | 'completed')
        : value;

    setFormData((prev) => ({
      ...prev,
      [name]: newValue,
    }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}
      {ongoingWarning && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 px-3 py-2 text-sm text-yellow-800">
          <div className="flex items-start gap-2">
            <svg className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <p>{ongoingWarning}</p>
            </div>
            {onDismissWarning && (
              <button
                type="button"
                onClick={onDismissWarning}
                className="text-yellow-600 hover:text-yellow-800 flex-shrink-0"
                aria-label="Dismiss warning"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}

      <Input
        label="Title"
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Start Date"
          type="date"
          name="start_date"
          value={formData.start_date}
          onChange={handleChange}
          error={errors.start_date}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />

        <Input
          label="End Date"
          type="date"
          name="end_date"
          value={formData.end_date}
          onChange={handleChange}
          error={errors.end_date}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Lifecycle Status"
          name="lifecycle_status"
          value={formData.lifecycle_status}
          onChange={handleChange}
          options={[
            { value: 'planned', label: 'Planned' },
            { value: 'ongoing', label: 'Ongoing' },
            { value: 'completed', label: 'Completed' },
          ]}
          className="shadow-sm  focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />

        <Select
          label="Status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          options={STATUS_OPTIONS_FORM.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

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

export default SchoolYearForm;

