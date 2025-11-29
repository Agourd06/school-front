import React, { useState, useEffect } from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import RichTextEditor from '../inputs/RichTextEditor';
import { Input, Select, Button } from '../ui';

export interface ModuleFormData {
  title: string;
  description: string;
  volume: string;
  coefficient: string;
  status: number;
}

export interface Module {
  id: number;
  title: string;
  description?: string;
  volume?: number;
  coefficient?: number;
  status: number;
}

interface ModuleFormProps {
  initialData?: Module | null;
  onSubmit: (data: ModuleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const ModuleForm: React.FC<ModuleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  const [formData, setFormData] = useState<ModuleFormData>({
    title: '',
    description: '',
    volume: '',
    coefficient: '',
    status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        description: initialData.description || '',
        volume: initialData.volume ? initialData.volume.toString() : '',
        coefficient: initialData.coefficient ? initialData.coefficient.toString() : '',
        status: initialData.status || 1,
      });
    } else {
      setFormData({
        title: '',
        description: '',
        volume: '',
        coefficient: '',
        status: 1,
      });
    }
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Module title is required';
    }

    if (formData.volume && (isNaN(Number(formData.volume)) || Number(formData.volume) < 0)) {
      newErrors.volume = 'Volume must be a positive number';
    }

    if (formData.coefficient && (isNaN(Number(formData.coefficient)) || Number(formData.coefficient) < 0)) {
      newErrors.coefficient = 'Coefficient must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('Module form submission failed:', error);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'status' || name === 'volume' ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}

      <Input
        label="Module Title"
        type="text"
        name="title"
        value={formData.title}
        onChange={handleChange}
        error={errors.title}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <Input
        label="Volume"
        type="number"
        name="volume"
        value={formData.volume}
        onChange={handleChange}
        error={errors.volume}
        
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <Input
        label="Coefficient "
        type="number"
        name="coefficient"
        value={formData.coefficient}
        onChange={handleChange}
        error={errors.coefficient}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <Select
        label="Status"
        name="status"
        value={formData.status}
        onChange={handleChange}
        options={STATUS_OPTIONS_FORM.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-heading mb-2">
          Description
        </label>
        <RichTextEditor
          value={formData.description}
          onChange={(value) => setFormData((prev) => ({ ...prev, description: value }))}
          placeholder="Enter module description..."
          rows={8}
        />
        {errors.description && <p className="mt-1 text-sm text-danger">{errors.description}</p>}
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

export default ModuleForm;

