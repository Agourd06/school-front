import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Select, Button } from '../ui';
import type { Profile } from '../../types/profile';
import { PROFILE_DEFAULT, PROFILE_OPTIONS } from '../../types/profile';

export interface UserFormData {
  username: string;
  email: string;
  password: string;
  profile: Profile;
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
    password: '',
    profile: PROFILE_DEFAULT,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || '',
        email: initialData.email || '',
        password: '',
        profile: initialData.profile || PROFILE_DEFAULT,
      });
    } else {
      setFormData({
        username: '',
        email: '',
        password: '',
        profile: PROFILE_DEFAULT,
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

    if (!isEditing && !formData.password.trim()) {
      newErrors.password = t('forms.passwordRequired');
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

      <Select
        label={t('forms.profile')}
        name="profile"
        value={formData.profile}
        onChange={handleChange}
        options={PROFILE_OPTIONS}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <Input
        label={isEditing ? t('forms.newPassword') + ' (' + t('forms.leaveBlankToKeepCurrent') + ')' : t('forms.password')}
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
        error={errors.password}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

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

