import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '../ui';
import type { PlanningSessionType, PlanningSessionTypeStatus } from '../../api/planningSessionType';

export interface PlanningSessionTypeFormData {
  title: string;
  type: string;
  coefficient?: number | null;
  status: PlanningSessionTypeStatus;
}

const DEFAULT_FORM: PlanningSessionTypeFormData = {
  title: '',
  type: '',
  coefficient: null,
  status: 'active',
};

const getStatusOptions = (t: (key: string) => string): Array<{ value: PlanningSessionTypeStatus; label: string }> => [
  { value: 'active', label: t('forms.active') },
  { value: 'inactive', label: t('forms.inactive') },
];

interface PlanningSessionTypeFormProps {
  initialData?: PlanningSessionType | null;
  onSubmit: (data: PlanningSessionTypeFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const PlanningSessionTypeForm: React.FC<PlanningSessionTypeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<PlanningSessionTypeFormData>(DEFAULT_FORM);
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
  }, [initialData]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = t('forms.titleRequired');
    if (!form.type.trim()) e.type = t('forms.typeCodeRequired');
    if (form.type.trim().length > 50) e.type = t('forms.typeCodeMaxLength');
    if (form.title.trim().length > 150) e.title = t('forms.titleMaxLength');
    if (form.coefficient !== null && form.coefficient !== undefined && Number.isNaN(Number(form.coefficient))) {
      e.coefficient = t('forms.coefficientMustBeNumber');
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleChange = (field: keyof PlanningSessionTypeFormData) => (value: string | number | null) => {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field as string]) {
      setErrors((prev) => ({ ...prev, [field as string]: '' }));
    }
  };

  const handleInputChange = (field: keyof PlanningSessionTypeFormData) => (event: React.ChangeEvent<HTMLInputElement>) => {
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
    await onSubmit({
      ...form,
      title: form.title.trim(),
      type: form.type.trim(),
      coefficient:
        form.coefficient === null || form.coefficient === undefined || Number.isNaN(Number(form.coefficient))
          ? null
          : Number(form.coefficient),
    });
  };

  const statusOptions = getStatusOptions(t);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label={t('common.name')}
        type="text"
        value={form.title}
        onChange={handleInputChange('title')}
        maxLength={150}
        placeholder={t('forms.laboratorySessionExample')}
        error={errors.title}
        className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <Input
        label={t('forms.type')}
        type="text"
        value={form.type}
        onChange={handleInputChange('type')}
        maxLength={50}
        placeholder={t('forms.labExample')}
        error={errors.type}
        className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('sections.coefficient')}
          type="number"
          step="0.01"
          value={form.coefficient ?? ''}
          onChange={handleInputChange('coefficient')}
          placeholder={t('common.optional')}
          error={errors.coefficient}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Select
          label={t('common.status')}
          value={form.status}
          onChange={(e) => handleChange('status')(e.target.value as PlanningSessionTypeStatus)}
          options={statusOptions.map((option) => ({
            value: option.value,
            label: option.label,
          }))}
          className="rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
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
          {initialData ? t('forms.updateType') : t('forms.createType')}
        </Button>
      </div>
    </form>
  );
};

export default PlanningSessionTypeForm;

