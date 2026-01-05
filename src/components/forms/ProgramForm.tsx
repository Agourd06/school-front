import React, { useState, useEffect } from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Select, Button, PdfFileInput } from '../ui';
import { validatePdfFile } from '../../utils/pdfValidation';

export interface ProgramFormData {
  title: string;
  description: string;
  status: number;
  pdf_file?: File | null;
}

export interface Program {
  id: number;
  title: string;
  description?: string;
  status: number;
  pdf_file?: string | null;
}

interface ProgramFormProps {
  initialData?: Program | null;
  onSubmit: (data: ProgramFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const ProgramForm: React.FC<ProgramFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  const [form, setForm] = useState<ProgramFormData>({
    title: '',
    description: '',
    status: 1,
    pdf_file: null,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        description: initialData.description || '',
        status: typeof initialData.status === 'number' ? initialData.status : 1,
        pdf_file: null,
      });
    } else {
      setForm({ title: '', description: '', status: 1, pdf_file: null });
    }
    setErrors({});
    setFormError('');
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: name === 'status' ? Number(value) : value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const nextErrors: Record<string, string> = {};
    if (!form.title.trim()) nextErrors.title = 'Title is required';
    
    // Validate PDF file if provided
    if (form.pdf_file) {
      const validation = validatePdfFile(form.pdf_file);
      if (!validation.isValid && validation.error) {
        nextErrors.pdf_file = validation.error;
      }
    }
    
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setFormError(axiosError?.response?.data?.message || 'Failed to save program');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(formError || serverError) && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {formError || serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
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
          onChange={(html) => setForm((prev) => ({ ...prev, description: html }))}
          placeholder="Describe the program..."
          rows={6}
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

export default ProgramForm;

