import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Button } from '../ui';
import { useRoles } from '../../hooks/useRoles';
import type { Role } from '../../api/roles';
import type { Profile } from '../../types/profile';

export interface UserFormData {
  username: string;
  email: string;
  role_ids: number[]; // REQUIRED: At least one role
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
  const { data: rolesResp } = useRoles({ page: 1, limit: 100 });
  const roles = rolesResp?.data ?? [];
  
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

    // REQUIRED: At least one role must be selected
    if (!isEditing && formData.role_ids.length === 0) {
      newErrors.role_ids = t('forms.atLeastOneRoleRequired') || 'Please select at least one role';
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

      {!isEditing && (
        <>
          <div>
            <label className="block text-sm font-medium text-heading mb-2">
              {t('forms.roles') || 'Roles'} * <span className="text-danger">(Required)</span>
            </label>
            <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-300 rounded-md p-3">
              {roles.length === 0 ? (
                <p className="text-sm text-muted">{t('forms.loadingRoles') || 'Loading roles...'}</p>
              ) : (
                roles.map((role: Role) => (
                  <label key={role.id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                    <input
                      type="checkbox"
                      checked={formData.role_ids.includes(role.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFormData(prev => ({
                            ...prev,
                            role_ids: [...prev.role_ids, role.id]
                          }));
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            role_ids: prev.role_ids.filter(id => id !== role.id)
                          }));
                        }
                        // Clear error when user selects a role
                        if (errors.role_ids) {
                          setErrors(prev => ({ ...prev, role_ids: '' }));
                        }
                      }}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-body">
                      {role.label} 
                      <span className="text-xs text-muted ml-1">
                        ({role.code})
                        {role.is_system && <span className="ml-1 text-blue-600">[System]</span>}
                      </span>
                    </span>
                  </label>
                ))
              )}
            </div>
            {errors.role_ids && (
              <p className="mt-1 text-sm text-danger">{errors.role_ids}</p>
            )}
            <p className="mt-1 text-xs text-muted">
              {t('forms.selectAtLeastOneRole') || 'Please select at least one role for this user.'}
            </p>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
            <p className="text-sm text-blue-900 font-medium mb-1">
              📧 {t('forms.passwordSetupEmail') || 'Password Setup Email'}
            </p>
            <p className="text-xs text-blue-800">
              {t('forms.passwordSetupEmailNote') || 'A password setup email with a secure link will be automatically sent to the user\'s email address. The user must click the link to set their password.'}
            </p>
          </div>
        </>
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

