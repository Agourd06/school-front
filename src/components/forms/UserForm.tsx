import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui';
import PhoneInput from '../inputs/PhoneInput';
import { Camera, X, User as UserIcon, Mail, AtSign, ImagePlus } from 'lucide-react';
import { getFileUrl } from '../../utils/apiConfig';
import type { Profile } from '../../types/profile';

export interface UserFormData {
  username: string;
  email: string;
  phone?: string;
  picture?: File | null;
  picturePreview?: string | null;
  role_ids?: number[];
}

export interface User {
  id: number;
  username: string;
  email: string;
  phone?: string | null;
  picture?: string | null;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<UserFormData>({
    username: '',
    email: '',
    phone: '',
    picture: null,
    picturePreview: null,
    role_ids: [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setFormData({
        username: initialData.username || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        picture: null,
        picturePreview: initialData.picture ? getFileUrl(initialData.picture) : null,
        role_ids: [],
      });
    } else {
      setFormData({
        username: '',
        email: '',
        phone: '',
        picture: null,
        picturePreview: null,
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

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, picture: t('forms.fileTooLarge') || 'File size must be less than 5MB' }));
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          picture: file,
          picturePreview: reader.result as string,
        }));
      };
      reader.readAsDataURL(file);
      setErrors(prev => ({ ...prev, picture: '' }));
    }
  };

  const handleRemovePicture = () => {
    setFormData(prev => ({
      ...prev,
      picture: null,
      picturePreview: null,
    }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {serverError && (
        <div className="rounded-xl border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
          {serverError}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
        <div className="flex flex-col items-center">
          <div className="relative group">
            <div className="w-28 h-28 rounded-full overflow-hidden bg-white border-4 border-white shadow-xl flex items-center justify-center ring-4 ring-primary/10">
              {formData.picturePreview ? (
                <img
                  src={formData.picturePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <UserIcon className="w-12 h-12 text-primary/40" />
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-1 right-1 p-2.5 bg-primary text-white rounded-full shadow-lg hover:bg-primary/90 hover:scale-110 transition-all duration-200 ring-4 ring-white"
            >
              <Camera className="w-4 h-4" />
            </button>
            {formData.picturePreview && (
              <button
                type="button"
                onClick={handleRemovePicture}
                className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full shadow-lg hover:bg-red-600 hover:scale-110 transition-all duration-200 ring-2 ring-white"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePictureChange}
            className="hidden"
          />
          {errors.picture && (
            <p className="mt-2 text-xs text-red-500 font-medium">{errors.picture}</p>
          )}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
          >
            <ImagePlus className="w-4 h-4" />
            {formData.picturePreview 
              ? (t('forms.changePicture') || 'Change photo')
              : (t('forms.uploadPicture') || 'Upload photo')
            }
          </button>
          <p className="text-xs text-muted mt-1">{t('forms.pictureHint') || 'JPG, PNG or GIF (max 5MB)'}</p>
        </div>
      </div>

      {/* Form Fields */}
      <div className="space-y-5">
        {/* Username Field */}
        <div className="relative">
          <label className="block text-sm font-semibold text-heading mb-2">
            {t('forms.username')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <AtSign className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-heading placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                errors.username 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-primary hover:border-gray-300'
              }`}
              placeholder={t('forms.enterUsername') || 'Enter username'}
            />
          </div>
          {errors.username && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.username}</p>
          )}
        </div>

        {/* Email Field */}
        <div className="relative">
          <label className="block text-sm font-semibold text-heading mb-2">
            {t('forms.email')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-heading placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-primary/10 ${
                errors.email 
                  ? 'border-red-300 focus:border-red-500' 
                  : 'border-gray-200 focus:border-primary hover:border-gray-300'
              }`}
              placeholder={t('forms.enterEmail') || 'Enter email address'}
            />
          </div>
          {errors.email && (
            <p className="mt-1.5 text-xs text-red-500 font-medium">{errors.email}</p>
          )}
        </div>

        {/* Phone Field */}
        <div className="relative">
          <label className="block text-sm font-semibold text-heading mb-2">
            {t('forms.phone')}
          </label>
          <PhoneInput
            name="phone"
            value={formData.phone || ''}
            onChange={handleChange}
          />
        </div>
      </div>

      {/* Info Box for New Users */}
      {!isEditing && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-semibold mb-1">
                {t('forms.passwordSetupEmail') || 'Password Setup Email'}
              </p>
              <p className="text-xs text-blue-700 leading-relaxed">
                {t('forms.passwordSetupEmailNote') || 'A password setup email with a secure link will be automatically sent to the user\'s email address. The user must click the link to set their password.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
        <Button 
          type="button" 
          variant="secondary" 
          onClick={onCancel} 
          disabled={isSubmitting}
          className="px-6"
        >
          {t('common.cancel')}
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
          className="px-8 shadow-lg shadow-primary/25"
        >
          {isEditing ? t('common.update') : t('common.create')}
        </Button>
      </div>
    </form>
  );
};

export default UserForm;

