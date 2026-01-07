import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      e.student_id = t('forms.studentRequired');
    }
    if (form.school_year_id === '' || form.school_year_id === null) {
      e.school_year_id = t('forms.schoolYearRequired');
    }
    if (form.level_id === '' || form.level_id === null) {
      e.level_id = t('forms.levelRequired');
    }
    const amountValue = form.amount.trim() === '' ? NaN : Number(form.amount);
    if (Number.isNaN(amountValue)) {
      e.amount = t('forms.amountMustBeNumber');
    } else if (amountValue <= 0) {
      e.amount = t('forms.amountMustBeGreaterThanZero');
    }
    const paymentValue = form.payment.trim() === '' ? NaN : Number(form.payment);
    if (Number.isNaN(paymentValue)) {
      e.payment = t('forms.paymentMustBeNumber');
    } else if (paymentValue < 0) {
      e.payment = t('forms.paymentMustBeZeroOrGreater');
    } else if (!Number.isNaN(amountValue) && paymentValue > amountValue) {
      e.payment = t('forms.paymentCannotExceedAmount');
    }
    if (!form.date) {
      e.date = t('forms.dateRequired');
    }
    if (!form.mode.trim()) {
      e.mode = t('forms.modeRequired');
    } else if (form.mode.length > 50) {
      e.mode = t('forms.modeMaxLength');
    }
    if (form.reference.trim().length > 100) {
      e.reference = t('forms.referenceMaxLength');
    }
    if (!allowedStatusValues.has(form.status)) {
      e.status = t('forms.invalidStatus');
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
      const data = option.data as { level_id?: number; levelId?: number } | undefined;
      const levelId = data?.level_id ?? data?.levelId;
      if (levelId === undefined || levelId === null) return true;
      return Number(levelId) === Number(form.level_id);
    });
  }, [levelPricingOptions, form.level_id]);

  const studentValue = useMemo(() => form.student_id ?? '', [form.student_id]);
  const schoolYearValue = useMemo(() => form.school_year_id ?? '', [form.school_year_id]);
  const levelValue = useMemo(() => form.level_id ?? '', [form.level_id]);
  const levelPricingValue = useMemo(() => form.level_pricing_id ?? '', [form.level_pricing_id]);

  // Get selected student for display when editing
  const selectedStudent = useMemo(() => {
    if (!form.student_id) return null;
    return studentOptions.find((opt) => Number(opt.value) === Number(form.student_id));
  }, [studentOptions, form.student_id]);

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
        <div>
          <label className="block text-sm font-medium text-heading mb-1">{t('sidebar.students')} *</label>
          {initialData ? (
            // Show read-only student info when editing
            <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-body">
              {selectedStudent ? (
                <div className="space-y-1">
                  <p className="font-medium">{selectedStudent.label}</p>
                  {selectedStudent.data && typeof selectedStudent.data === 'object' && selectedStudent.data !== null && 'email' in selectedStudent.data ? (
                    <p className="text-xs text-muted">{String((selectedStudent.data as { email?: unknown }).email ?? '')}</p>
                  ) : null}
                </div>
              ) : (
                <p className="text-muted italic">{t('forms.studentInfoNotAvailable')}</p>
              )}
            </div>
          ) : (
            // Show SearchSelect when creating
            <SearchSelect
              value={studentValue}
              onChange={handleSelectChange('student_id')}
              options={studentOptions}
              placeholder={t('forms.selectStudent')}
              error={errors.student_id}
            />
          )}
        </div>
        <SearchSelect
          label={t('sidebar.schoolYears')}
          value={schoolYearValue}
          onChange={handleSelectChange('school_year_id')}
          options={schoolYearOptions}
          placeholder={t('forms.selectSchoolYear')}
          error={errors.school_year_id}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <SearchSelect
          label={t('sidebar.levels')}
          value={levelValue}
          onChange={(value) => {
            handleSelectChange('level_id')(value);
            setForm((prev) => ({
              ...prev,
              level_pricing_id: '',
            }));
          }}
          options={levelOptions}
          placeholder={t('forms.selectLevel')}
          error={errors.level_id}
        />
        <SearchSelect
          label={t('forms.levelPricingOptional')}
          value={levelPricingValue}
          onChange={handleSelectChange('level_pricing_id')}
          options={filteredLevelPricingOptions}
          placeholder={t('forms.allPricingPlans')}
          isClearable
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Input
          label={t('forms.amount')}
          type="number"
          min={0}
          step={0.01}
          value={form.amount}
          onChange={handleAmountChange}
          placeholder={t('forms.totalAmount')}
          error={errors.amount}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Input
          label={t('forms.payment')}
          type="number"
          min={0}
          step={0.01}
          value={form.payment}
          onChange={handlePaymentChange}
          placeholder={t('forms.amountPaid')}
          error={errors.payment}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Input
          label={t('common.date')}
          type="date"
          value={form.date}
          onChange={handleInputChange('date')}
          error={errors.date}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <Select
          label={t('forms.mode')}
          value={form.mode}
          onChange={(e) => {
            setForm((prev) => ({ ...prev, mode: e.target.value }));
            if (errors.mode) setErrors((prev) => ({ ...prev, mode: '' }));
          }}
          options={[
            { value: '', label: t('forms.selectPaymentMode') },
            ...modeOptions.map((option) => ({ value: option, label: option })),
          ]}
          error={errors.mode}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Input
          label={t('forms.referenceOptional')}
          type="text"
          value={form.reference}
          onChange={handleInputChange('reference')}
          maxLength={100}
          placeholder={t('forms.transactionReference')}
          error={errors.reference}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Select
          label={t('common.status')}
          value={form.status}
          onChange={handleStatusChange}
          options={statusOptionsFormSelect.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          error={errors.status}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? t('forms.updatePayment') : t('forms.createPayment')}
        </Button>
      </div>
    </form>
  );
};

export default StudentPaymentForm;

