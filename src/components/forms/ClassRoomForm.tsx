import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { validateRequired, validatePositiveNumber } from '../modals/validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import { useClassroomTypes } from '../../hooks/useClassroomTypes';

export interface ClassRoomFormData {
  code: string;
  title: string;
  capacity: string;
  classroom_type_id: number | '';
  status: number;
}

export interface ClassRoom {
  id: number;
  code: string;
  title: string;
  capacity: number | null;
  classroom_type_id?: number | null;
  classroomType?: { id: number; title: string; status?: number } | null;
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState<ClassRoomFormData>({
    code: '',
    title: '',
    capacity: '',
    classroom_type_id: '',
    status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load active classroom types from API
  const { data: classroomTypesResp } = useClassroomTypes({ status: 1, limit: 100 });
  const classroomTypes = classroomTypesResp?.data || [];
  const sortedClassroomTypes = [...classroomTypes].sort((a, b) => a.title.localeCompare(b.title));

  useEffect(() => {
    if (initialData) {
      setForm({
        code: initialData.code || '',
        title: initialData.title || '',
        capacity: initialData.capacity != null ? String(initialData.capacity) : '',
        classroom_type_id: initialData.classroom_type_id != null && initialData.classroom_type_id !== 0 ? initialData.classroom_type_id : '',
        status: typeof initialData.status === 'number' ? initialData.status : 1,
      });
    } else {
      setForm({ code: '', title: '', capacity: '', classroom_type_id: '', status: 1 });
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'status' ? Number(value) : name === 'classroom_type_id' ? (value === '' ? '' : Number(value)) : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If name is empty but code has a value, copy code to name before validation
    const formToSubmit = { ...form };
    if (!formToSubmit.title.trim() && formToSubmit.code.trim()) {
      formToSubmit.title = formToSubmit.code;
    }
    
    // Temporarily update form state for validation
    const originalForm = form;
    setForm(formToSubmit);
    
    // Validate with updated form
    const newErrors: Record<string, string> = {};
    const codeErr = validateRequired(formToSubmit.code, t('forms.code'));
    if (codeErr) newErrors.code = codeErr;
    const titleErr = validateRequired(formToSubmit.title, t('common.name'));
    if (titleErr) newErrors.title = titleErr;
    const capErr = validatePositiveNumber(formToSubmit.capacity, t('forms.capacity'));
    if (capErr) newErrors.capacity = capErr;
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length > 0) {
      // Restore original form if validation fails
      setForm(originalForm);
      return;
    }
    
    await onSubmit(formToSubmit);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label={t('forms.code')}
          name="code"
          value={form.code}
          onChange={handleChange}
          error={errors.code}
          required={!form.title.trim()}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />

        <Input
          label={t('common.name')}
          name="title"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />

        <Input
          label={t('forms.capacity')}
          type="number"
          name="capacity"
          value={form.capacity}
          onChange={handleChange}
          error={errors.capacity}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <Select
            label={t('forms.type')}
            name="classroom_type_id"
            value={form.classroom_type_id === '' || form.classroom_type_id === null || form.classroom_type_id === 0 ? '' : String(form.classroom_type_id)}
            onChange={handleChange}
            options={[
              { value: '', label: t('forms.noType') },
              ...sortedClassroomTypes.map((t) => ({
                value: String(t.id),
                label: t.title,
              })),
            ]}
            className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
          <p className="mt-1 text-xs text-gray-500">
            {t('forms.toCreateType')}{' '}
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="font-medium text-secondary hover:text-secondary/80 underline cursor-pointer transition-colors"
            >
              {t('sidebar.settings')}
            </button>
            {' > '}{t('forms.types')}{' > '}{t('forms.classRoomType')}
          </p>
        </div>
        <Select
          label={t('common.status')}
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

      <div className="flex justify-end space-x-3 pt-4">
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

export default ClassRoomForm;

