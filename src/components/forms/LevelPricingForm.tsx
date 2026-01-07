import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { STATUS_OPTIONS, STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import type { LevelPricing, LevelPricingStatus } from '../../api/levelPricing';

export interface LevelPricingFormData {
  level_id: number | '';
  title: string;
  amount: string;
  occurrences: string;
  every_month: boolean;
  status: LevelPricingStatus;
}

const DEFAULT_FORM: LevelPricingFormData = {
  level_id: '',
  title: '',
  amount: '',
  occurrences: '1',
  every_month: false,
  status: 2,
};

const statusOptionsFormSelect = STATUS_OPTIONS_FORM.map((option) => ({
  value: option.value,
  label: option.label,
}));

const allowedStatusValues = new Set(STATUS_OPTIONS.map((opt) => Number(opt.value)));

interface LevelPricingFormProps {
  initialData?: LevelPricing | null;
  onSubmit: (data: LevelPricingFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  levelOptions: SearchSelectOption[];
}

const LevelPricingForm: React.FC<LevelPricingFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  levelOptions,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<LevelPricingFormData>(DEFAULT_FORM);
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
        status: normalizedStatus,
      });
    } else {
      setForm(DEFAULT_FORM);
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.level_id === '' || form.level_id === null) {
      e.level_id = t('forms.levelRequired');
    }
    if (!form.title.trim()) {
      e.title = t('forms.titleRequired');
    } else if (form.title.trim().length > 150) {
      e.title = t('forms.titleMaxLength');
    }

    const amountValue = form.amount.trim() === '' ? NaN : Number(form.amount);
    if (Number.isNaN(amountValue)) {
      e.amount = t('forms.amountMustBeNumber');
    } else if (amountValue <= 0) {
      e.amount = t('forms.amountMustBeGreaterThanZero');
    }

    const occurrencesValue = form.occurrences.trim() === '' ? 1 : Number(form.occurrences);
    if (Number.isNaN(occurrencesValue) || occurrencesValue < 1) {
      e.occurrences = t('forms.occurrencesMin');
    }

    if (!allowedStatusValues.has(form.status)) {
      e.status = t('forms.invalidStatus');
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSelectChange = (field: keyof LevelPricingFormData) => (value: number | '' | string) => {
    setForm((prev) => ({
      ...prev,
      [field]: value === '' ? '' : Number(value),
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const levelValue = useMemo(() => form.level_id ?? '', [form.level_id]);

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
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <SearchSelect
          label={t('sidebar.levels')}
          value={levelValue}
          onChange={handleSelectChange('level_id')}
          options={levelOptions}
          placeholder={t('forms.selectLevel')}
          error={errors.level_id}
        />
        <Input
          label={t('common.name')}
          type="text"
          value={form.title}
          onChange={handleTitleChange}
          maxLength={150}
          placeholder={t('forms.enterPricingTitle')}
          error={errors.title}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
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
          placeholder={t('forms.enterAmount')}
          error={errors.amount}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Input
          label={t('forms.occurrences')}
          type="number"
          min={1}
          step={1}
          value={form.occurrences}
          onChange={handleOccurrencesChange}
          placeholder={t('forms.numberOfOccurrences')}
          error={errors.occurrences}
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center gap-3 pt-6 md:pt-8">
          <label className="flex items-center gap-2 text-sm font-medium text-heading">
            <input
              type="checkbox"
              checked={form.every_month}
              onChange={(event) => setForm((prev) => ({ ...prev, every_month: event.target.checked }))}
              className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
            />
            {t('forms.monthlyBilling')}
          </label>
          <span className="text-xs text-muted">{t('forms.toggleToRepeatEveryMonth')}</span>
        </div>
      </div>

      {serverError && <p className="text-sm text-danger">{serverError}</p>}

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {initialData ? t('forms.updatePricing') : t('forms.createPricing')}
        </Button>
      </div>
    </form>
  );
};

export default LevelPricingForm;

