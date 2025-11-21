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
}

const SchoolYearForm: React.FC<SchoolYearFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  isOpen = true,
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
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <Input
        label="Title"
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <Input
        label="Start Date"
        type="date"
        name="start_date"
        value={formData.start_date}
        onChange={handleChange}
        error={errors.start_date}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <Input
        label="End Date"
        type="date"
        name="end_date"
        value={formData.end_date}
        onChange={handleChange}
        error={errors.end_date}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

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
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
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

export default SchoolYearForm;

