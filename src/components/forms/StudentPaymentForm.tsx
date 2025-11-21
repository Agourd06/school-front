import React, { useState, useEffect, useMemo } from 'react';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { STATUS_OPTIONS, STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import type { StudentPaymentStatus } from '../../api/studentPayment';

export interface StudentPaymentFormData {
  student_id: number | '';
  school_year_id: number | '';
  level_id: number | '';
  level_pricing_id: number | '';
  amount: string;
  payment: string;
  date: string;
  mode: string;
  reference: string;
  status: StudentPaymentStatus;
}

export interface StudentPayment {
  id: number;
  student_id?: number;
  school_year_id?: number;
  level_id?: number;
  level_pricing_id?: number;
  amount?: number | string;
  payment?: number | string;
  date?: string;
  mode?: string;
  reference?: string;
  status: StudentPaymentStatus;
}

const statusOptionsFormSelect = STATUS_OPTIONS_FORM.map((option) => ({
  value: option.value,
  label: option.label,
}));

const allowedStatusValues = new Set(STATUS_OPTIONS.map((opt) => Number(opt.value)));

interface StudentPaymentFormProps {
  initialData?: StudentPayment | null;
  onSubmit: (data: StudentPaymentFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  studentOptions: SearchSelectOption[];
  schoolYearOptions: SearchSelectOption[];
  levelOptions: SearchSelectOption[];
  levelPricingOptions: SearchSelectOption[];
  modeOptions?: string[];
}

const StudentPaymentForm: React.FC<StudentPaymentFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  studentOptions,
  schoolYearOptions,
  levelOptions,
  levelPricingOptions,
  modeOptions = ['Cash', 'Card', 'Transfer', 'Check'],
}) => {
  const [form, setForm] = useState<StudentPaymentFormData>({
    student_id: '',
    school_year_id: '',
    level_id: '',
    level_pricing_id: '',
    amount: '',
    payment: '',
    date: '',
    mode: '',
    reference: '',
    status: 2,
  });
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
        status: normalizedStatus,
      });
    } else {
      setForm({
        student_id: '',
        school_year_id: '',
        level_id: '',
        level_pricing_id: '',
        amount: '',
        payment: '',
        date: '',
        mode: '',
        reference: '',
        status: 2,
      });
    }
    setErrors({});
  }, [initialData]);

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
    } else if (!Number.isNaN(amountValue) && paymentValue > amountValue) {
      e.payment = 'Payment cannot exceed the total amount';
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

  const handleSelectChange = (field: keyof StudentPaymentFormData) => (value: number | '' | string) => {
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

  const handleInputChange = (field: keyof StudentPaymentFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Input
          label="Amount"
          type="number"
          min={0}
          step={0.01}
          value={form.amount}
          onChange={handleAmountChange}
          placeholder="Total amount"
          error={errors.amount}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Input
          label="Payment"
          type="number"
          min={0}
          step={0.01}
          value={form.payment}
          onChange={handlePaymentChange}
          placeholder="Amount paid"
          error={errors.payment}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Input
          label="Date"
          type="date"
          value={form.date}
          onChange={handleInputChange('date')}
          error={errors.date}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Select
          label="Mode"
          value={form.mode}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, mode: e.target.value }));
            if (errors.mode) setErrors((prev) => ({ ...prev, mode: '' }));
          }}
          options={[
            { value: '', label: 'Select payment mode' },
            ...modeOptions.map((option) => ({ value: option, label: option })),
          ]}
          error={errors.mode}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Input
          label="Reference (optional)"
          type="text"
          value={form.reference}
          onChange={handleInputChange('reference')}
          maxLength={100}
          placeholder="Transaction reference"
          error={errors.reference}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Select
          label="Status"
          value={form.status}
          onChange={handleStatusChange}
          options={statusOptionsFormSelect.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          error={errors.status}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

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
          {initialData ? 'Update Payment' : 'Create Payment'}
        </Button>
      </div>
    </form>
  );
};

export default StudentPaymentForm;

