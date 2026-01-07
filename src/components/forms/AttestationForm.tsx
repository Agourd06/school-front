import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Select, Button } from '../ui';
import type { Attestation } from '../../api/attestation';

export interface AttestationFormData {
  title: string;
  description: string;
  statut: number;
}

interface AttestationFormProps {
  initialData?: Attestation | null;
  onSubmit: (data: AttestationFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}


const AttestationForm: React.FC<AttestationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  const { t } = useTranslation();
  const [form, setForm] = useState<AttestationFormData>({
    title: '',
    description: '',
    statut: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        statut: typeof initialData.statut === 'number' ? initialData.statut : 1,
      });
    } else {
      setForm({ 
        title: '', 
        description: '', 
        statut: 1 
      });
    }
    setErrors({});
    setFormError('');
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'statut' ? Number(value) : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleDescriptionChange = (html: string) => {
    // Just update the description - no placeholder replacement needed
    setForm((prev) => ({ ...prev, description: html }));
    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = t('forms.titleRequired');
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = axiosError?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setFormError(errorMessage.join(', '));
      } else if (typeof errorMessage === 'string') {
        setFormError(errorMessage);
      } else if (axiosError?.message) {
        setFormError(axiosError.message);
      } else {
        setFormError(t('forms.failedToSaveAttestation'));
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(formError || serverError) && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {formError || serverError}
        </div>
      )}

      <Input
        label={`${t('common.name')} *`}
        name="title"
        value={form.title}
        onChange={handleChange}
        error={errors.title}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <Select
        label={t('common.status')}
        name="statut"
        value={form.statut}
        onChange={handleChange}
        options={STATUS_OPTIONS_FORM.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <div>
        <label className="block text-sm font-medium text-heading">{t('common.description')}</label>
        <div className="mt-1">
          <RichTextEditor
            value={form.description}
            onChange={handleDescriptionChange}
            placeholder={t('forms.enterDescription')}
            rows={6}
          />
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
};

export default AttestationForm;

