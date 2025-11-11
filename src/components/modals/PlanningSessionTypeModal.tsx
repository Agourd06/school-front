import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import type { PlanningSessionType, PlanningSessionTypeStatus } from '../../api/planningSessionType';

export interface PlanningSessionTypeFormValues {
  title: string;
  type: string;
  coefficient?: number | null;
  company_id?: number | null;
  status: PlanningSessionTypeStatus;
}

interface PlanningSessionTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PlanningSessionType | null;
  onSubmit: (values: PlanningSessionTypeFormValues) => Promise<void>;
  isSubmitting?: boolean;
  companyOptions: SearchSelectOption[];
  serverError?: string | null;
}

const DEFAULT_FORM: PlanningSessionTypeFormValues = {
  title: '',
  type: '',
  coefficient: null,
  company_id: null,
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
  companyOptions,
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
        company_id: initialData.company_id ?? null,
        status: initialData.status ?? 'active',
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const selectedCompanyOption = useMemo(() => {
    if (form.company_id === null || form.company_id === undefined) return '';
    return form.company_id;
  }, [form.company_id]);

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
        company_id: form.company_id ?? null,
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
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            type="text"
            value={form.title}
            onChange={handleInputChange('title')}
            maxLength={150}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.title ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g. Laboratory Session"
          />
          {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Type Code</label>
          <input
            type="text"
            value={form.type}
            onChange={handleInputChange('type')}
            maxLength={50}
            className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.type ? 'border-red-300' : 'border-gray-300'
            }`}
            placeholder="e.g. LAB"
          />
          {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Coefficient</label>
            <input
              type="number"
              step="0.01"
              value={form.coefficient ?? ''}
              onChange={handleInputChange('coefficient')}
              className={`mt-1 block w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.coefficient ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="Optional"
            />
            {errors.coefficient && <p className="mt-1 text-sm text-red-600">{errors.coefficient}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={(e) => handleChange('status')(e.target.value as PlanningSessionTypeStatus)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <SearchSelect
          label="Company"
          value={selectedCompanyOption ?? ''}
          onChange={(value) => handleChange('company_id')(value === '' ? null : Number(value))}
          options={companyOptions}
          placeholder="Optional company"
          isClearable
        />

        {serverError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {serverError}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
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
            {isSubmitting ? 'Saving…' : initialData ? 'Update Type' : 'Create Type'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default PlanningSessionTypeModal;


