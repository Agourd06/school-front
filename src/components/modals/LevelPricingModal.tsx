import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { STATUS_OPTIONS, STATUS_OPTIONS_FORM } from '../../constants/status';
import type { LevelPricing, LevelPricingStatus } from '../../api/levelPricing';

export interface LevelPricingFormValues {
  level_id: number | '';
  title: string;
  amount: string;
  occurrences: string;
  every_month: boolean;
  company_id: number | '';
  status: LevelPricingStatus;
}

interface LevelPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: LevelPricing | null;
  onSubmit: (values: LevelPricingFormValues) => Promise<void>;
  isSubmitting?: boolean;
  levelOptions: SearchSelectOption[];
  companyOptions: SearchSelectOption[];
  serverError?: string | null;
}

const DEFAULT_FORM: LevelPricingFormValues = {
  level_id: '',
  title: '',
  amount: '',
  occurrences: '1',
  every_month: false,
  company_id: '',
  status: 2,
};

const statusOptionsFormSelect = STATUS_OPTIONS_FORM.map((option) => ({
  value: option.value,
  label: option.label,
}));

const allowedStatusValues = new Set(STATUS_OPTIONS.map((opt) => Number(opt.value)));

const LevelPricingModal: React.FC<LevelPricingModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  levelOptions,
  companyOptions,
  serverError,
}) => {
  const [form, setForm] = useState<LevelPricingFormValues>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const normalizedStatus = allowedStatusValues.has(initialData.status)
        ? initialData.status
        : 2;

      setForm({
        level_id: initialData.level_id ?? '',
        title: initialData.title ?? '',
        amount: initialData.amount ? String(initialData.amount) : '',
        occurrences: initialData.occurrences ? String(initialData.occurrences) : '1',
        every_month: initialData.every_month === 1,
        company_id: initialData.company_id ?? '',
        status: normalizedStatus,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [initialData, isOpen]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.level_id === '' || form.level_id === null) {
      e.level_id = 'Level is required';
    }
    if (!form.title.trim()) {
      e.title = 'Title is required';
    } else if (form.title.trim().length > 150) {
      e.title = 'Title must be at most 150 characters';
    }

    const amountValue = form.amount.trim() === '' ? NaN : Number(form.amount);
    if (Number.isNaN(amountValue)) {
      e.amount = 'Amount must be a number';
    } else if (amountValue <= 0) {
      e.amount = 'Amount must be greater than 0';
    }

    const occurrencesValue = form.occurrences.trim() === '' ? 1 : Number(form.occurrences);
    if (Number.isNaN(occurrencesValue) || occurrencesValue < 1) {
      e.occurrences = 'Occurrences must be at least 1';
    }

    if (!allowedStatusValues.has(form.status)) {
      e.status = 'Invalid status selected';
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectChange = (field: keyof LevelPricingFormValues) => (value: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const levelValue = useMemo(() => form.level_id ?? '', [form.level_id]);
  const companyValue = useMemo(() => form.company_id ?? '', [form.company_id]);

  const handleOccurrencesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*$/.test(value)) {
      setForm((prev) => ({ ...prev, occurrences: value }));
      if (errors.occurrences) {
        setErrors((prev) => ({ ...prev, occurrences: '' }));
      }
    }
  };

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*(\.\d{0,2})?$/.test(value) || value === '') {
      setForm((prev) => ({ ...prev, amount: value }));
      if (errors.amount) {
        setErrors((prev) => ({ ...prev, amount: '' }));
      }
    }
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, title: event.target.value }));
    if (errors.title) {
      setErrors((prev) => ({ ...prev, title: '' }));
    }
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      status: Number(event.target.value) as LevelPricingStatus,
    }));
    if (errors.status) {
      setErrors((prev) => ({ ...prev, status: '' }));
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
      title={initialData ? 'Edit Level Pricing' : 'Add Level Pricing'}
      className="sm:max-w-3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SearchSelect
            label="Level"
            value={levelValue}
            onChange={handleSelectChange('level_id')}
            options={levelOptions}
            placeholder="Select level"
            error={errors.level_id}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={handleTitleChange}
              maxLength={150}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter pricing title"
            />
            {errors.title && <p className="mt-1 text-sm text-red-600">{errors.title}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Amount</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.amount}
              onChange={handleAmountChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter amount"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Occurrences</label>
            <input
              type="number"
              min={1}
              step={1}
              value={form.occurrences}
              onChange={handleOccurrencesChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Number of occurrences"
            />
            {errors.occurrences && <p className="mt-1 text-sm text-red-600">{errors.occurrences}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={form.status}
              onChange={handleStatusChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {statusOptionsFormSelect.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SearchSelect
            label="Company (optional)"
            value={companyValue}
            onChange={handleSelectChange('company_id')}
            options={companyOptions}
            placeholder="Select company"
          />
          <div className="flex items-center gap-3 pt-6 md:pt-8">
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <input
                type="checkbox"
                checked={form.every_month}
                onChange={(event) => setForm((prev) => ({ ...prev, every_month: event.target.checked }))}
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              Monthly billing
            </label>
            <span className="text-xs text-gray-500">Toggle to repeat every month</span>
          </div>
        </div>

        {serverError && <p className="text-sm text-red-600">{serverError}</p>}

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
            {isSubmitting ? 'Saving…' : initialData ? 'Update Pricing' : 'Create Pricing'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default LevelPricingModal;

