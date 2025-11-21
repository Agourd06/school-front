import React, { useState, useEffect } from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Select, Button } from '../ui';

export interface SpecializationFormData {
  title: string;
  program_id: number | string | '';
  status: number;
  description: string;
}

export interface Specialization {
  id: number;
  title: string;
  program_id?: number;
  program?: { id: number; title: string };
  status: number;
  description?: string;
}

interface SpecializationFormProps {
  initialData?: Specialization | null;
  onSubmit: (data: SpecializationFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  programs: Array<{ id: number; title: string }>;
  selectedProgram?: { id: number; title: string } | null;
  isProgramLocked?: boolean;
  initialProgramId?: number;
}

const SpecializationForm: React.FC<SpecializationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  programs,
  selectedProgram,
  isProgramLocked = false,
  initialProgramId,
}) => {
  const [form, setForm] = useState<SpecializationFormData>({
    title: '',
    program_id: '',
    status: 1,
    description: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        program_id: initialData.program_id ?? initialData.program?.id ?? '',
        status: typeof initialData.status === 'number' ? initialData.status : 1,
        description: initialData.description || '',
      });
    } else {
      setForm({
        title: '',
        program_id: initialProgramId ?? '',
        status: 1,
        description: '',
      });
    }
    setErrors({});
    setFormError('');
  }, [initialData, initialProgramId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'status' ? Number(value) : name === 'program_id' ? (value ? Number(value) : '') : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.program_id) next.program_id = 'Program is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFormError(axiosError?.response?.data?.message || 'Failed to save specialization');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(formError || serverError) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError || serverError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700">Program</label>
        {isProgramLocked && (selectedProgram || initialData?.program) ? (
          <div className="mt-1 p-3 bg-gray-50 border border-gray-300 rounded-md">
            <div className="text-sm font-medium text-gray-900">
              {selectedProgram?.title || initialData?.program?.title || 'N/A'}
            </div>
          </div>
        ) : (
          <Select
            name="program_id"
            value={form.program_id}
            onChange={handleChange}
            disabled={isProgramLocked}
            options={[
              { value: '', label: 'Select a program' },
              ...programs.map((p) => ({ value: p.id, label: p.title })),
            ]}
            error={errors.program_id}
            className={`shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
              isProgramLocked ? 'bg-gray-100 cursor-not-allowed' : ''
            }`}
          />
        )}
      </div>

      <Input
        label="Title"
        name="title"
        value={form.title}
        onChange={handleChange}
        error={errors.title}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <Select
        label="Status"
        name="status"
        value={form.status}
        onChange={handleChange}
        options={STATUS_OPTIONS_FORM.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <RichTextEditor
          value={form.description}
          onChange={(html) => {
            setForm((prev) => ({ ...prev, description: html }));
          }}
          placeholder="Describe the specialization..."
          rows={5}
        />
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

export default SpecializationForm;

