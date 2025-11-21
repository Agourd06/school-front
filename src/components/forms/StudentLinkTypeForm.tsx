import React, { useState, useEffect } from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';

export interface StudentLinkTypeFormData {
  title: string;
  status: number;
}

export interface StudentLinkType {
  id: number;
  title: string;
  status: number;
}

interface StudentLinkTypeFormProps {
  initialData?: StudentLinkType | null;
  onSubmit: (data: StudentLinkTypeFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const StudentLinkTypeForm: React.FC<StudentLinkTypeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<number>(1);
  const [error, setError] = useState('');

  useEffect(() => {
    setTitle(initialData?.title || '');
    setStatus(typeof initialData?.status === 'number' ? initialData.status : 1);
    setError('');
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!title.trim()) {
      setError('Title is required');
      return;
    }
    try {
      await onSubmit({ title, status });
    } catch (err: unknown) {
      setError(err?.response?.data?.message || 'Failed to save');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <Input
        label="Title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Parent, Guardian, etc."
        error={error}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <Select
        label="Status"
        value={status}
        onChange={(e) => setStatus(Number(e.target.value))}
        options={STATUS_OPTIONS_FORM.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
      />

      <div className="flex justify-end space-x-3 pt-2">
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

export default StudentLinkTypeForm;

