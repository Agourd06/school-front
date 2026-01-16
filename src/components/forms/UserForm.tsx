import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Button } from '../ui';
import type { Profile } from '../../types/profile';

export interface UserFormData {
  username: string;
  email: string;
  role_ids?: number[]; // Optional: Roles will be assigned after user creation via role button
  // profile field is REMOVED - replaced with roles system
}

export interface User {
  id: number;
  username: string;
  email: string;
  profile: Profile;
  company_id?: number;
  created_at?: string;
  updated_at?: string;
}

interface UserFormProps {
  initialData?: User | null;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const UserForm: React.FC<UserFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    role_ids: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || '',
        email: initialData.email || '',
        role_ids: [], // Will be loaded separately via useUserRoles hook
      });
    } else {
      setFormData({
        username: '',
        email: '',
        role_ids: [],
      });
    }
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = t('forms.usernameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('forms.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('forms.emailInvalid');
    }

    // Roles are not required during creation - they will be assigned later via role button

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error('User form submission failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
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
        label={t('forms.username')}
        type="text"
        name="username"
        value={formData.username}
        onChange={handleChange}
        error={errors.username}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <Input
        label={t('forms.email')}
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
        error={errors.email}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      {!isEditing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-900 font-medium mb-1">
            📧 {t('forms.passwordSetupEmail') || 'Password Setup Email'}
          </p>
          <p className="text-xs text-blue-800">
            {t('forms.passwordSetupEmailNote') || 'A password setup email with a secure link will be automatically sent to the user\'s email address. The user must click the link to set their password.'}
          </p>
          <p className="text-xs text-blue-800 mt-2">
            {t('forms.rolesAssignedLater') || 'Note: Roles can be assigned after user creation using the role assignment button.'}
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          {isEditing ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;

