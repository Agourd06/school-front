import React, { useState, useEffect } from 'react';
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
      setForm({ title: '', description: '', statut: 1 });
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
    setForm((prev) => ({ ...prev, description: html }));
    if (errors.description) setErrors((prev) => ({ ...prev, description: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string | string[] } } };
      const errorMessage = axiosError?.response?.data?.message;
      if (Array.isArray(errorMessage)) {
        setFormError(errorMessage.join(', '));
      } else if (typeof errorMessage === 'string') {
        setFormError(errorMessage);
      } else {
        setFormError(err?.message || 'Failed to save attestation');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(formError || serverError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError || serverError}
        </div>
      )}

      <Input
        label="Title *"
        name="title"
        value={form.title}
        onChange={handleChange}
        error={errors.title}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <Select
        label="Status"
        name="statut"
        value={form.statut}
        onChange={handleChange}
        options={STATUS_OPTIONS_FORM.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700">Description</label>
        <div className="mt-1">
          <RichTextEditor
            value={form.description}
            onChange={handleDescriptionChange}
            placeholder="Enter description..."
            rows={6}
          />
        </div>
      </div>

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

export default AttestationForm;

