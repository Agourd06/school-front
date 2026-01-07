import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
      setError(t('forms.titleRequired'));
      return;
    }
    try {
      await onSubmit({ title, status });
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string | string[] } } };
      const serverMsg = axiosError?.response?.data?.message;
      const errorMessage = Array.isArray(serverMsg) 
        ? serverMsg.join(', ') 
        : (typeof serverMsg === 'string' ? serverMsg : t('forms.failedToSave'));
      setError(errorMessage);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}

      {error && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {error}
        </div>
      )}

      <Input
        label={t('common.name')}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t('forms.linkTypePlaceholder')}
        error={error}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <Select
        label={t('common.status')}
        value={status}
        onChange={(e) => setStatus(Number(e.target.value))}
        options={STATUS_OPTIONS_FORM.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
      />

      <div className="flex justify-end space-x-3 pt-2">
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

export default StudentLinkTypeForm;

