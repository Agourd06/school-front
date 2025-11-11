import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { STATUS_OPTIONS, STATUS_OPTIONS_FORM } from '../../constants/status';
import type { StudentPayment, StudentPaymentStatus } from '../../api/studentPayment';

export interface StudentPaymentFormValues {
  student_id: number | '';
  school_year_id: number | '';
  level_id: number | '';
  level_pricing_id: number | '';
  amount: string;
  payment: string;
  date: string;
  mode: string;
  reference: string;
  company_id: number | '';
  status: StudentPaymentStatus;
}

interface StudentPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: StudentPayment | null;
  onSubmit: (values: StudentPaymentFormValues) => Promise<void>;
  isSubmitting?: boolean;
  studentOptions: SearchSelectOption[];
  schoolYearOptions: SearchSelectOption[];
  levelOptions: SearchSelectOption[];
  levelPricingOptions: SearchSelectOption[];
  companyOptions: SearchSelectOption[];
  modeOptions?: string[];
  serverError?: string | null;
}

const DEFAULT_FORM: StudentPaymentFormValues = {
  student_id: '',
  school_year_id: '',
  level_id: '',
  level_pricing_id: '',
  amount: '',
  payment: '',
  date: '',
  mode: '',
  reference: '',
  company_id: '',
  status: 2,
};

const statusOptionsFormSelect = STATUS_OPTIONS_FORM.map((option) => ({
  value: option.value,
  label: option.label,
}));

const allowedStatusValues = new Set(STATUS_OPTIONS.map((opt) => Number(opt.value)));

const StudentPaymentModal: React.FC<StudentPaymentModalProps> = ({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSubmitting,
  studentOptions,
  schoolYearOptions,
  levelOptions,
  levelPricingOptions,
  companyOptions,
  modeOptions = ['Cash', 'Card', 'Transfer', 'Check'],
  serverError,
}) => {
  const [form, setForm] = useState<StudentPaymentFormValues>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const normalizedStatus = allowedStatusValues.has(initialData.status) ? initialData.status : 2;
      setForm({
        student_id: initialData.student_id ?? '',
        school_year_id: initialData.school_year_id ?? '',
        level_id: initialData.level_id ?? '',
        level_pricing_id: initialData.level_pricing_id ?? '',
        amount: initialData.amount ? String(initialData.amount) : '',
        payment: initialData.payment ? String(initialData.payment) : '',
        date: initialData.date ?? '',
        mode: initialData.mode ?? '',
        reference: initialData.reference ?? '',
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
    if (form.student_id === '' || form.student_id === null) {
      e.student_id = 'Student is required';
    }
    if (form.school_year_id === '' || form.school_year_id === null) {
      e.school_year_id = 'School year is required';
    }
    if (form.level_id === '' || form.level_id === null) {
      e.level_id = 'Level is required';
    }
    const amountValue = form.amount.trim() === '' ? NaN : Number(form.amount);
    if (Number.isNaN(amountValue)) {
      e.amount = 'Amount must be a number';
    } else if (amountValue <= 0) {
      e.amount = 'Amount must be greater than 0';
    }
    const paymentValue = form.payment.trim() === '' ? NaN : Number(form.payment);
    if (Number.isNaN(paymentValue)) {
      e.payment = 'Payment must be a number';
    } else if (paymentValue < 0) {
      e.payment = 'Payment must be 0 or greater';
    }
    if (!form.date) {
      e.date = 'Date is required';
    }
    if (!form.mode.trim()) {
      e.mode = 'Mode is required';
    } else if (form.mode.length > 50) {
      e.mode = 'Mode must be at most 50 characters';
    }
    if (form.reference.trim().length > 100) {
      e.reference = 'Reference must be at most 100 characters';
    }
    if (!allowedStatusValues.has(form.status)) {
      e.status = 'Invalid status selected';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectChange = (field: keyof StudentPaymentFormValues) => (value: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const filteredLevelPricingOptions = useMemo(() => {
    if (!form.level_id) return levelPricingOptions;
    return levelPricingOptions.filter((option) => {
      const levelId = option.data?.level_id ?? option.data?.levelId;
      if (levelId === undefined || levelId === null) return true;
      return Number(levelId) === Number(form.level_id);
    });
  }, [levelPricingOptions, form.level_id]);

  const studentValue = useMemo(() => form.student_id ?? '', [form.student_id]);
  const schoolYearValue = useMemo(() => form.school_year_id ?? '', [form.school_year_id]);
  const levelValue = useMemo(() => form.level_id ?? '', [form.level_id]);
  const levelPricingValue = useMemo(() => form.level_pricing_id ?? '', [form.level_pricing_id]);
  const companyValue = useMemo(() => form.company_id ?? '', [form.company_id]);

  const handleAmountChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*(\.\d{0,2})?$/.test(value) || value === '') {
      setForm((prev) => ({ ...prev, amount: value }));
      if (errors.amount) {
        setErrors((prev) => ({ ...prev, amount: '' }));
      }
    }
  };

  const handlePaymentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d*(\.\d{0,2})?$/.test(value) || value === '') {
      setForm((prev) => ({ ...prev, payment: value }));
      if (errors.payment) {
        setErrors((prev) => ({ ...prev, payment: '' }));
      }
    }
  };

  const handleInputChange = (field: keyof StudentPaymentFormValues) => (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleStatusChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setForm((prev) => ({
      ...prev,
      status: Number(event.target.value) as StudentPaymentStatus,
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
      title={initialData ? 'Edit Student Payment' : 'Add Student Payment'}
      className="sm:max-w-4xl"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <SearchSelect
            label="Student"
            value={studentValue}
            onChange={handleSelectChange('student_id')}
            options={studentOptions}
            placeholder="Select student"
            error={errors.student_id}
          />
          <SearchSelect
            label="School Year"
            value={schoolYearValue}
            onChange={handleSelectChange('school_year_id')}
            options={schoolYearOptions}
            placeholder="Select school year"
            error={errors.school_year_id}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <SearchSelect
            label="Level"
            value={levelValue}
            onChange={(value) => {
              handleSelectChange('level_id')(value);
              // reset level pricing if mismatch
              setForm((prev) => ({
                ...prev,
                level_pricing_id: '',
              }));
            }}
            options={levelOptions}
            placeholder="Select level"
            error={errors.level_id}
          />
          <SearchSelect
            label="Level Pricing (optional)"
            value={levelPricingValue}
            onChange={handleSelectChange('level_pricing_id')}
            options={filteredLevelPricingOptions}
            placeholder="All pricing plans"
            isClearable
          />
          <SearchSelect
            label="Company (optional)"
            value={companyValue}
            onChange={handleSelectChange('company_id')}
            options={companyOptions}
            placeholder="Select company"
          />
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
              placeholder="Total amount"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-600">{errors.amount}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Payment</label>
            <input
              type="number"
              min={0}
              step={0.01}
              value={form.payment}
              onChange={handlePaymentChange}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Amount paid"
            />
            {errors.payment && <p className="mt-1 text-sm text-red-600">{errors.payment}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={form.date}
              onChange={handleInputChange('date')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {errors.date && <p className="mt-1 text-sm text-red-600">{errors.date}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Mode</label>
            <select
              value={form.mode}
              onChange={(event) => {
                setForm((prev) => ({ ...prev, mode: event.target.value }));
                if (errors.mode) setErrors((prev) => ({ ...prev, mode: '' }));
              }}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select payment mode</option>
              {modeOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            {errors.mode && <p className="mt-1 text-sm text-red-600">{errors.mode}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Reference (optional)</label>
            <input
              type="text"
              value={form.reference}
              onChange={handleInputChange('reference')}
              maxLength={100}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Transaction reference"
            />
            {errors.reference && <p className="mt-1 text-sm text-red-600">{errors.reference}</p>}
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
            {isSubmitting ? 'Saving…' : initialData ? 'Update Payment' : 'Create Payment'}
          </button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentPaymentModal;


