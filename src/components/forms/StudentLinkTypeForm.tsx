import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Button } from '../ui';

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
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-heading mb-1">
          {t('settings.title')}
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={t('forms.linkTypePlaceholder')}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-body placeholder:text-muted/70 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
        />
        {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-heading mb-1">
          {t('common.status')}
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(Number(e.target.value))}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-body shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors custom-select"
        >
          {STATUS_OPTIONS_FORM.map((opt) => {
            const statusLabels: Record<number, string> = {
              0: t('forms.disabled'),
              1: t('forms.active'),
              2: t('forms.pending'),
              [-1]: t('forms.archived'),
            };
            return (
              <option key={opt.value} value={opt.value}>
                {statusLabels[opt.value] || opt.label}
              </option>
            );
          })}
        </select>
      </div>

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

      <div className="flex justify-end space-x-3 pt-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {initialData ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
};

export default StudentLinkTypeForm;

