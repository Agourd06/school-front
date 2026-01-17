import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Button } from '../ui';
import type { Role } from '../../api/roles';

export interface RoleFormData {
  code: string;
  label: string;
}

interface RoleFormProps {
  initialData?: Role | null;
  onSubmit: (data: RoleFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const RoleForm: React.FC<RoleFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<RoleFormData>({
    code: '',
    label: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        code: initialData.code || '',
        label: initialData.label || '',
      });
    } else {
      setFormData({
        code: '',
        label: '',
      });
    }
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.code.trim()) {
      newErrors.code = t('forms.roleCodeRequired') || 'Role code is required';
    } else {
      // Validate code format: lowercase, alphanumeric, underscores only
      if (!/^[a-z0-9_]+$/.test(formData.code)) {
        newErrors.code = t('forms.roleCodeInvalid') || 'Code must be lowercase, alphanumeric with underscores only';
      }
      // Prevent creating 'prof' role - use 'teacher' instead
      if (formData.code.toLowerCase().trim() === 'prof') {
        newErrors.code = t('forms.roleCodeProfNotAllowed') || 'Role code "prof" is not allowed. Please use "teacher" instead.';
      }
    }

    if (!formData.label.trim()) {
      newErrors.label = t('forms.roleLabelRequired') || 'Role label is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Normalize code to lowercase
      const normalizedData = {
        ...formData,
        code: formData.code.toLowerCase().trim(),
        label: formData.label.trim(),
      };
      await onSubmit(normalizedData);
    } catch (error) {
      console.error('Role form submission failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Auto-lowercase code field
    if (name === 'code') {
      setFormData((prev) => ({ ...prev, [name]: value.toLowerCase() }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {serverError && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {serverError}
        </div>
      )}

      <div>
        <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
          {t('forms.roleCode') || 'Role Code'} <span className="text-red-500">*</span>
        </label>
        <Input
          id="code"
          type="text"
          name="code"
          value={formData.code}
          onChange={handleChange}
          error={errors.code}
          disabled={isEditing}
          placeholder="accountant"
          pattern="[a-z0-9_]+"
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          {isEditing 
            ? t('forms.roleCodeCannotBeChanged') || 'Code cannot be changed after creation'
            : t('forms.roleCodeHint') || 'Lowercase, alphanumeric, underscores only (e.g., "accountant", "librarian")'
          }
        </p>
      </div>

      <div>
        <label htmlFor="label" className="block text-sm font-medium text-gray-700 mb-2">
          {t('forms.roleLabel') || 'Role Label'} <span className="text-red-500">*</span>
        </label>
        <Input
          id="label"
          type="text"
          name="label"
          value={formData.label}
          onChange={handleChange}
          error={errors.label}
          placeholder="Accountant"
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
        <p className="mt-1 text-xs text-gray-500">
          {t('forms.roleLabelHint') || 'Human-readable name (e.g., "Accountant", "Librarian")'}
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1"
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting
            ? (isEditing ? t('common.updating') || 'Updating...' : t('common.creating') || 'Creating...')
            : (isEditing ? t('common.update') : t('common.create'))
          }
        </Button>
      </div>
    </form>
  );
};

export default RoleForm;
