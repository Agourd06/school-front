import React, { useState, useEffect } from 'react';
import { validateRequired, validatePositiveNumber } from '../modals/validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';

export interface ClassRoomFormData {
  code: string;
  title: string;
  capacity: string;
  status: number;
}

export interface ClassRoom {
  id: number;
  code: string;
  title: string;
  capacity: number | null;
  status: number;
}

interface ClassRoomFormProps {
  initialData?: ClassRoom | null;
  onSubmit: (data: ClassRoomFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const ClassRoomForm: React.FC<ClassRoomFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  const [form, setForm] = useState<ClassRoomFormData>({
    code: '',
    title: '',
    capacity: '',
    status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        code: initialData.code || '',
        title: initialData.title || '',
        capacity: initialData.capacity != null ? String(initialData.capacity) : '',
        status: typeof initialData.status === 'number' ? initialData.status : 1,
      });
    } else {
      setForm({ code: '', title: '', capacity: '', status: 1 });
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'status' ? Number(value) : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const codeErr = validateRequired(form.code, 'Code');
    if (codeErr) newErrors.code = codeErr;
    const titleErr = validateRequired(form.title, 'Title');
    if (titleErr) newErrors.title = titleErr;
    const capErr = validatePositiveNumber(form.capacity, 'Capacity');
    if (capErr) newErrors.capacity = capErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      <Input
        label="Code"
        name="code"
        value={form.code}
        onChange={handleChange}
        error={errors.code}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <Input
        label="Title"
        name="title"
        value={form.title}
        onChange={handleChange}
        error={errors.title}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <Input
        label="Capacity"
        type="number"
        name="capacity"
        value={form.capacity}
        onChange={handleChange}
        error={errors.capacity}
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

export default ClassRoomForm;

