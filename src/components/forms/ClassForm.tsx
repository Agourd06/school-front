import React, { useState, useEffect } from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Select, Button } from '../ui';

export interface ClassFormData {
  title: string;
  description: string;
  program_id: number | string | '';
  specialization_id: number | string | '';
  level_id: number | string | '';
  school_year_id: number | string | '';
  school_year_period_id: number | string | '';
  status: number;
}

export interface Class {
  id: number;
  title: string;
  description?: string;
  program_id?: number;
  program?: { id: number; title: string };
  specialization_id?: number;
  specialization?: { id: number; title: string };
  level_id?: number;
  level?: { id: number; title: string };
  school_year_id?: number;
  schoolYear?: { id: number; title: string };
  school_year_period_id?: number;
  schoolYearPeriod?: { id: number; title: string };
  status: number;
}

interface ClassFormProps {
  initialData?: Class | null;
  onSubmit: (data: ClassFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  programs: Array<{ id: number; title: string }>;
  specializations: Array<{ id: number; title: string }>;
  levels: Array<{ id: number; title: string }>;
  schoolYears: Array<{ id: number; title: string }>;
  periods: Array<{ id: number; title: string }>;
  descriptionPosition?: 'top' | 'bottom';
  onDescriptionPreview?: () => void;
  onFormChange?: (formData: { program_id: number | string | ''; specialization_id: number | string | ''; school_year_id: number | string | '' }) => void;
}

const ClassForm: React.FC<ClassFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  programs,
  specializations,
  levels,
  schoolYears,
  periods,
  descriptionPosition = 'top',
  onDescriptionPreview,
  onFormChange,
}) => {
  const [form, setForm] = useState<ClassFormData>({
    title: '',
    description: '',
    program_id: '',
    specialization_id: '',
    level_id: '',
    school_year_id: '',
    school_year_period_id: '',
    status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        program_id: initialData.program_id ?? initialData.program?.id ?? '',
        specialization_id: initialData.specialization_id ?? initialData.specialization?.id ?? '',
        level_id: initialData.level_id ?? initialData.level?.id ?? '',
        school_year_id: initialData.school_year_id ?? initialData.schoolYear?.id ?? '',
        school_year_period_id: initialData.school_year_period_id ?? initialData.schoolYearPeriod?.id ?? '',
        status: typeof initialData.status === 'number' ? initialData.status : 1,
      });
    } else {
      setForm({
        title: '',
        description: '',
        program_id: '',
        specialization_id: '',
        level_id: '',
        school_year_id: '',
        school_year_period_id: '',
        status: 1,
      });
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => {
      let nextValue: any = value;
      if (name === 'status') nextValue = Number(value);
      if (['program_id', 'specialization_id', 'level_id', 'school_year_id', 'school_year_period_id'].includes(name)) {
        nextValue = value ? Number(value) : '';
      }
      const updated = { ...prev, [name]: nextValue };
      if (name === 'program_id') {
        updated.specialization_id = '';
        updated.level_id = '';
      }
      if (name === 'specialization_id') {
        updated.level_id = '';
      }
      if (name === 'school_year_id') {
        updated.school_year_period_id = '';
      }
      if (onFormChange && (name === 'program_id' || name === 'specialization_id' || name === 'school_year_id')) {
        onFormChange({
          program_id: updated.program_id,
          specialization_id: updated.specialization_id,
          school_year_id: updated.school_year_id,
        });
      }
      return updated;
    });
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.school_year_id) next.school_year_id = 'School year is required';
    if (!form.program_id) next.program_id = 'Program is required';
    if (!form.specialization_id) next.specialization_id = 'Specialization is required';
    if (!form.level_id) next.level_id = 'Level is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(form);
    } catch (err: any) {
      // Error handling is done in the modal
    }
  };

  const descriptionEditor = (
    <div>
      <div className="mb-1 flex items-center justify-between gap-3">
        <label className="block text-sm font-medium text-gray-700 mb-0">Description</label>
        {onDescriptionPreview && (
          <button
            type="button"
            onClick={onDescriptionPreview}
            className="inline-flex items-center rounded-md border border-green-200 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            View details
          </button>
        )}
      </div>
      <RichTextEditor
        value={form.description}
        onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
        placeholder="Describe the class..."
        rows={10}
      />
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          name="status"
          value={form.status}
          onChange={handleChange}
          options={STATUS_OPTIONS_FORM.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      </div>

      {descriptionPosition === 'top' && descriptionEditor}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="School Year *"
          name="school_year_id"
          value={form.school_year_id}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select school year' },
            ...schoolYears.map((year) => ({
              value: year.id,
              label: year.title,
            })),
          ]}
          error={errors.school_year_id}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <Select
          label="School Year Period"
          name="school_year_period_id"
          value={form.school_year_period_id}
          onChange={handleChange}
          disabled={!form.school_year_id}
          options={[
            { value: '', label: 'Select period (optional)' },
            ...periods.map((period) => ({
              value: period.id,
              label: period.title,
            })),
          ]}
          error={errors.school_year_period_id}
          className={`shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            !form.school_year_id ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Program *"
          name="program_id"
          value={form.program_id}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select program' },
            ...programs.map((program) => ({
              value: program.id,
              label: program.title,
            })),
          ]}
          error={errors.program_id}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
        <Select
          label="Specialization *"
          name="specialization_id"
          value={form.specialization_id}
          onChange={handleChange}
          disabled={!form.program_id}
          options={[
            { value: '', label: 'Select specialization' },
            ...specializations.map((spec) => ({
              value: spec.id,
              label: spec.title,
            })),
          ]}
          error={errors.specialization_id}
          className={`shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
            !form.program_id ? 'bg-gray-100 cursor-not-allowed' : ''
          }`}
        />
      </div>

      <Select
        label="Level *"
        name="level_id"
        value={form.level_id}
        onChange={handleChange}
        disabled={!form.specialization_id}
        options={[
          { value: '', label: 'Select level' },
          ...levels.map((level) => ({
            value: level.id,
            label: level.title,
          })),
        ]}
        error={errors.level_id}
        className={`shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${
          !form.specialization_id ? 'bg-gray-100 cursor-not-allowed' : ''
        }`}
      />

      {descriptionPosition === 'bottom' && descriptionEditor}

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

export default ClassForm;

