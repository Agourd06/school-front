import React, { useState, useEffect } from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Select, Button, PdfFileInput } from '../ui';
import { validatePdfFile } from '../../utils/pdfValidation';

export interface LevelFormData {
  title: string;
  description: string;
  level: string;
  specialization_id: number | string | '';
  program_id: number | string | '';
  status: number;
  pdf_file?: File | null;
}

export interface Level {
  id: number;
  title: string;
  description?: string;
  level?: number | null;
  specialization_id?: number;
  specialization?: { id: number; title: string; program?: { id: number; title: string }; program_id?: number };
  status: number;
  pdf_file?: string | null;
}

interface LevelFormProps {
  initialData?: Level | null;
  onSubmit: (data: LevelFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  programs: Array<{ id: number; title: string }>;
  specializations: Array<{ id: number; title: string }>;
  selectedSpecialization?: { id: number; title: string; program_id?: number } | null;
  fetchedProgram?: { id: number; title: string } | null;
  isProgramLocked?: boolean;
  isSpecializationLocked?: boolean;
  initialSpecializationId?: number;
  onFormChange?: (formData: { program_id: number | string | ''; specialization_id: number | string | '' }) => void;
}

const LevelForm: React.FC<LevelFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  programs,
  specializations,
  selectedSpecialization,
  fetchedProgram,
  isProgramLocked = false,
  isSpecializationLocked = false,
  initialSpecializationId,
  onFormChange,
}) => {
  const [form, setForm] = useState<LevelFormData>({
    title: '',
    description: '',
    level: '1',
    specialization_id: '',
    program_id: '',
    status: 1,
    pdf_file: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      const specialization = initialData.specialization || null;
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        level: initialData.level != null ? String(initialData.level) : '',
        specialization_id: initialData.specialization_id ?? specialization?.id ?? '',
        program_id: specialization?.program?.id ?? specialization?.program_id ?? '',
        status: typeof initialData.status === 'number' ? initialData.status : 1,
        pdf_file: null,
      });
    } else {
      setForm({
        title: '',
        description: '',
        level: '1',
        specialization_id: initialSpecializationId ?? '',
        program_id: selectedSpecialization?.program_id ?? '',
        status: 1,
        pdf_file: null,
      });
    }
    setErrors({});
  }, [initialData, initialSpecializationId, selectedSpecialization]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'status'
          ? Number(value)
          : name === 'program_id' || name === 'specialization_id'
          ? value
            ? Number(value)
            : ''
          : value,
    }));
    if (name === 'program_id') {
      setForm((prev) => ({ ...prev, specialization_id: '' }));
    }
    if (onFormChange && (name === 'program_id' || name === 'specialization_id')) {
      const updated = { ...form, [name]: name === 'program_id' || name === 'specialization_id' ? (value ? Number(value) : '') : value };
      if (name === 'program_id') {
        updated.specialization_id = '';
      }
      onFormChange({
        program_id: updated.program_id,
        specialization_id: updated.specialization_id,
      });
    }
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.title.trim()) next.title = 'Title is required';
    if (!form.specialization_id) next.specialization_id = 'Specialization is required';
    if (form.level && isNaN(Number(form.level))) next.level = 'Level must be a number';
    
    // Validate PDF file if provided
    if (form.pdf_file) {
      const validation = validatePdfFile(form.pdf_file);
      if (!validation.isValid && validation.error) {
        next.pdf_file = validation.error;
      }
    }
    
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handlePdfChange = (file: File | null, error?: string) => {
    setForm((prev) => ({ ...prev, pdf_file: file }));
    if (error) {
      setErrors((prev) => ({ ...prev, pdf_file: error }));
    } else if (errors.pdf_file) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.pdf_file;
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(form);
    } catch {
      // Error handling is done in the modal
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-heading">Program & Specialization *</label>
        {isProgramLocked && fetchedProgram && (selectedSpecialization || initialData?.specialization) ? (
          <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-surface border border-border rounded-md">
              <div className="text-xs font-medium text-muted mb-1">Program</div>
              <div className="text-sm font-medium text-heading">{fetchedProgram?.title || 'N/A'}</div>
            </div>
            <div className="p-3 bg-surface border border-border rounded-md">
              <div className="text-xs font-medium text-muted mb-1">Specialization</div>
              <div className="text-sm font-medium text-heading">
                {selectedSpecialization?.title || initialData?.specialization?.title || 'N/A'}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-body mb-1">Program</label>
              <Select
                name="program_id"
                value={form.program_id}
                onChange={handleChange}
                disabled={isProgramLocked}
                options={[
                  { value: '', label: 'All programs' },
                  ...programs.map((program) => ({ value: program.id, label: program.title })),
                ]}
                className={`shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                  isProgramLocked ? 'bg-muted-foreground cursor-not-allowed' : ''
                }`}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-body mb-1">Specialization</label>
              <Select
                name="specialization_id"
                value={form.specialization_id}
                onChange={handleChange}
                disabled={isSpecializationLocked}
                options={[
                  { value: '', label: 'Select specialization' },
                  ...specializations.map((spec) => ({ value: spec.id, label: spec.title })),
                ]}
                error={errors.specialization_id}
                className={`shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm ${
                  isSpecializationLocked ? 'bg-muted-foreground cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
        <Input
          label="Level number"
          name="level"
          value={form.level}
          onChange={handleChange}
          error={errors.level}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      {/* PDF Upload */}
      <PdfFileInput
        label="PDF Document"
        value={form.pdf_file}
        onChange={handlePdfChange}
        existingPdfPath={initialData?.pdf_file}
        error={errors.pdf_file}
      />

      <div>
        <label className="block text-sm font-medium text-heading mb-1">Description</label>
        <RichTextEditor
          value={form.description}
          onChange={(html) => {
            setForm((prev) => ({ ...prev, description: html }));
          }}
          placeholder="Describe the level..."
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

export default LevelForm;

