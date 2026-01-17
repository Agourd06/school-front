import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompanies';
import { useUpdateCompany } from '../../hooks/useCompanies';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Camera, X } from 'lucide-react';
import { getFileUrl } from '../../utils/apiConfig';

const CompanySettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  
  const { data: company, isLoading } = useCompany(companyId || 0);
  const updateMutation = useUpdateCompany();
  
  const [phone, setPhone] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to get logo URL
  const getLogoUrl = (logo?: string | null) => {
    if (!logo) return null;
    const url = getFileUrl(logo);
    return url?.trim() || null;
  };

  useEffect(() => {
    if (company) {
      setPhone(company.phone || '');
    }
  }, [company]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setLogoError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setLogoError('Image size must be less than 2MB');
        return;
      }
      
      setLogoFile(file);
      setLogoError(null);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = async () => {
    if (!companyId || !company) return;
    
    setIsUploadingLogo(true);
    setLogoError(null);
    
    try {
      await updateMutation.mutateAsync({
        id: companyId,
        logo: null,
      });
      
      // Clear preview and file
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Update AuthContext with updated company data (logo removed)
      if (user && user.company_id === companyId) {
        const { authApi } = await import('../../api/auth');
        try {
          const profileResponse = await authApi.getProfile();
          const serverUser = profileResponse.user;
          
          if (serverUser?.company) {
            const updatedUserData = { ...user, company: serverUser.company };
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            window.dispatchEvent(new CustomEvent('company-updated'));
          }
        } catch (profileError) {
          // Fallback: update with logo removed
          const updatedUserData = { ...user, company: { ...user.company, logo: null } };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
          window.dispatchEvent(new CustomEvent('company-updated'));
        }
      }
      
      // Reload page to ensure all components have fresh data
      window.location.reload();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = Array.isArray(axiosError?.response?.data?.message)
        ? axiosError.response.data.message.join(', ')
        : axiosError?.response?.data?.message || axiosError?.message || 'Failed to remove logo';
      setLogoError(errorMessage);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !companyId) return;
    
    setIsUploadingLogo(true);
    setLogoError(null);
    
    try {
      const updatedCompany = await updateMutation.mutateAsync({
        id: companyId,
        logo: logoFile,
      });
      
      // Clear preview and file - the logo will now come from company.logo
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
      // Update AuthContext with new company data (including logo)
      // Fetch fresh profile data to ensure we have the latest company logo
      if (user && user.company_id === companyId) {
        const { authApi } = await import('../../api/auth');
        try {
          const profileResponse = await authApi.getProfile();
          const serverUser = profileResponse.user;
          
          if (serverUser?.company) {
            // Update localStorage with fresh company data from server (includes logo)
            const updatedUserData = { ...user, company: serverUser.company };
            localStorage.setItem('user', JSON.stringify(updatedUserData));
            
            // Trigger a custom event to refresh AuthContext immediately
            window.dispatchEvent(new CustomEvent('company-updated'));
          }
        } catch (profileError) {
          // Fallback: use updated company from mutation response
          const updatedUserData = { ...user, company: updatedCompany };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
          window.dispatchEvent(new CustomEvent('company-updated'));
        }
      }
      
      // Reload page to ensure all components have fresh data
      window.location.reload();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = Array.isArray(axiosError?.response?.data?.message)
        ? axiosError.response.data.message.join(', ')
        : axiosError?.response?.data?.message || axiosError?.message || 'Failed to upload logo';
      setLogoError(errorMessage);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSave = async () => {
    if (!companyId) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      await updateMutation.mutateAsync({
        id: companyId,
        phone: phone.trim() || undefined,
      });
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = Array.isArray(axiosError?.response?.data?.message)
        ? axiosError.response.data.message.join(', ')
        : axiosError?.response?.data?.message || axiosError?.message || 'Failed to update company';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted">{t('common.loading') || 'Loading...'}</div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-muted">{t('common.error') || 'Company not found'}</p>
      </div>
    );
  }

  const displayLogoUrl = logoPreview || getLogoUrl(company.logo);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-heading mb-4">
          {t('settings.companyInfo') || 'Company Information'}
        </h2>
        
        <div className="space-y-4">
          {/* Company Name - Disabled Input */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              {t('settings.companyName') || 'Company Name'}
            </label>
            <Input
              type="text"
              value={company.name || ''}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>

          {/* Company Email - Disabled Input */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              {t('settings.companyEmail') || 'Company Email'}
            </label>
            <Input
              type="email"
              value={company.email || ''}
              disabled
              className="bg-gray-50 cursor-not-allowed"
            />
          </div>

          {/* Company Phone - Editable */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              {t('settings.companyPhone') || 'Company Phone'}
            </label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+1234567890"
            />
          </div>

          {/* Company Logo */}
          <div>
            <label className="block text-sm font-medium text-muted mb-1">
              {t('settings.companyLogo') || 'Company Logo'}
            </label>
            <div className="flex items-start gap-4">
              <div className="relative">
                {displayLogoUrl ? (
                  <img
                    src={displayLogoUrl}
                    alt="Company Logo"
                    className="w-24 h-24 rounded-lg border-2 border-tertiary"
                    style={{ 
                      width: '96px', 
                      height: '96px',
                      objectFit: 'contain',
                      objectPosition: 'center',
                      backgroundColor: '#f9fafb'
                    }}
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-tertiary" style={{ width: '96px', height: '96px' }}>
                    <span className="text-xs text-gray-500">No Logo</span>
                  </div>
                )}
                {logoFile && (
                  <button
                    type="button"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                    aria-label="Remove preview"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                    onChange={handleLogoChange}
                    className="hidden"
                    id="logo-upload"
                  />
                  <label
                    htmlFor="logo-upload"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    {logoFile ? t('common.change') || 'Change' : t('common.upload') || 'Upload'} Logo
                  </label>
                  {displayLogoUrl && !logoFile && (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={handleRemoveLogo}
                      disabled={isUploadingLogo}
                    >
                      {t('common.remove') || 'Remove'}
                    </Button>
                  )}
                </div>
                {logoFile && (
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="primary"
                      onClick={handleLogoUpload}
                      disabled={isUploadingLogo}
                    >
                      {isUploadingLogo ? t('common.uploading') || 'Uploading...' : t('common.save') || 'Save Logo'}
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={isUploadingLogo}
                    >
                      {t('common.cancel') || 'Cancel'}
                    </Button>
                  </div>
                )}
                {logoError && (
                  <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                    {logoError}
                  </div>
                )}
                <p className="text-xs text-muted">
                  {t('settings.logoHint') || 'Allowed formats: JPEG, PNG, GIF, WebP. Max size: 2MB'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button for Phone */}
      <div className="flex items-center justify-between pt-4 border-t border-tertiary/20">
        <div className="flex-1">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
              {t('settings.companyUpdated') || 'Company updated successfully'}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={handleSave}
          disabled={isSaving || phone === (company.phone || '')}
        >
          {isSaving ? t('common.saving') || 'Saving...' : t('common.save') || 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default CompanySettings;
