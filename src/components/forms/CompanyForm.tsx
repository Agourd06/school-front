import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Input, Button } from '../ui';
import PhoneInput from '../inputs/PhoneInput';

export interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  website: string;
}

export interface Company {
  id: number;
  name: string;
  email: string;
  phone?: string;
  website?: string;
  created_at?: string;
  updated_at?: string;
}

interface CompanyFormProps {
  initialData?: Company | null;
  onSubmit: (data: CompanyFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const CompanyForm: React.FC<CompanyFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState<CompanyFormData>({
    name: '',
    email: '',
    phone: '',
    website: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        website: initialData.website || '',
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        website: '',
      });
    }
    setErrors({});
  }, [initialData]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('forms.companyNameRequired');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('forms.emailRequired');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('forms.emailInvalid');
    }

    if (formData.website && !formData.website.match(/^https?:\/\/.+/)) {
      newErrors.website = t('forms.websiteMustStartWithHttp');
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
      console.error('Company form submission failed:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
        label={t('forms.companyName')}
        type="text"
        name="name"
        value={formData.name}
        onChange={handleChange}
        error={errors.name}
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

      <PhoneInput
        label={t('forms.phone')}
        name="phone"
        value={formData.phone}
        onChange={handleChange}
        error={errors.phone}
        className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
      />

      <Input
        label={t('forms.website')}
        type="url"
        name="website"
        value={formData.website}
        onChange={handleChange}
        placeholder="https://example.com"
        error={errors.website}
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
          {initialData ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
};

export default CompanyForm;

