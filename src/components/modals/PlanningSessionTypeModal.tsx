import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { Input, Select, Button } from '../ui';
import type { PlanningSessionType, PlanningSessionTypeStatus } from '../../api/planningSessionType';

export interface PlanningSessionTypeFormValues {
  title: string;
  type: string;
  coefficient?: number | null;
  // company_id is automatically set by the API from authenticated user
  status: PlanningSessionTypeStatus;
}

interface PlanningSessionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PlanningSessionType | null;
  onSubmit: (values: PlanningSessionTypeFormValues) => Promise<void>;
  isSubmitting?: boolean;
  // companyOptions removed - company is auto-set from authenticated user
  serverError?: string | null;
}

const DEFAULT_FORM: PlanningSessionTypeFormValues = {
  title: '',
  type: '',
  coefficient: null,
  status: 'active',
};

const statusOptions: Array<{ value: PlanningSessionTypeStatus; label: string }> = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

const PlanningSessionTypeModal: React.FC<PlanningSessionTypeModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  serverError,
}) => {
  const [form, setForm] = useState<PlanningSessionTypeFormValues>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title ?? '',
        type: initialData.type ?? '',
        coefficient:
          initialData.coefficient === undefined || initialData.coefficient === null
            ? null
            : Number(initialData.coefficient),
        status: initialData.status ?? 'active',
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [initialData, isOpen]);


  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.type.trim()) e.type = 'Type code is required';
    if (form.type.trim().length > 50) e.type = 'Type code must be at most 50 characters';
    if (form.title.trim().length > 150) e.title = 'Title must be at most 150 characters';
    if (form.coefficient !== null && form.coefficient !== undefined && Number.isNaN(Number(form.coefficient))) {
      e.coefficient = 'Coefficient must be a number';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof PlanningSessionTypeFormValues) => (value: string | number | null) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleInputChange = (field: keyof PlanningSessionTypeFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = event.target;
    let parsedValue: string | number | null = value;
    if (field === 'coefficient') {
      parsedValue = value === '' ? null : Number(value);
    }
    handleChange(field)(parsedValue);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit({
        ...form,
        title: form.title.trim(),
        type: form.type.trim(),
        coefficient:
          form.coefficient === null || form.coefficient === undefined || Number.isNaN(Number(form.coefficient))
            ? null
            : Number(form.coefficient),
        // company_id is automatically set by the API from authenticated user
      });
      onClose();
    } catch (err) {
      // Allow parent to display error feedback; keep modal open.
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Planning Session Type' : 'Add Planning Session Type'}
      className="sm:max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Title"
          type="text"
          value={form.title}
          onChange={handleInputChange('title')}
          maxLength={150}
          placeholder="e.g. Laboratory Session"
          error={errors.title}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <Input
          label="Type"
          type="text"
          value={form.type}
          onChange={handleInputChange('type')}
          maxLength={50}
          placeholder="e.g. LAB"
          error={errors.type}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Coefficient"
            type="number"
            step="0.01"
            value={form.coefficient ?? ''}
            onChange={handleInputChange('coefficient')}
            placeholder="Optional"
            error={errors.coefficient}
            className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => handleChange('status')(e.target.value as PlanningSessionTypeStatus)}
            options={statusOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
            className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
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
            {initialData ? 'Update Type' : 'Create Type'}
          </Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default PlanningSessionTypeModal;


