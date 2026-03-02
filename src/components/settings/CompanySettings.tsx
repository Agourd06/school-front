import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompanies';
import { useUpdateCompany } from '../../hooks/useCompanies';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { Camera, X, FileText } from 'lucide-react';
import { getFileUrl } from '../../utils/apiConfig';

const CompanySettings: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const companyId = user?.company_id;
  
  const { data: company, isLoading } = useCompany(companyId || 0);
  const updateMutation = useUpdateCompany();
  
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [codePostal, setCodePostal] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // PDF Layout fields
  const [entete1, setEntete1] = useState('');
  const [entete2, setEntete2] = useState('');
  const [entete3, setEntete3] = useState('');
  const [pied1, setPied1] = useState('');
  const [pied2, setPied2] = useState('');
  const [pied3, setPied3] = useState('');

  // PDF Layout boolean settings
  const [logoLeft, setLogoLeft] = useState(false);
  const [logoRight, setLogoRight] = useState(false);
  const [papierEntete, setPapierEntete] = useState(false);

  // Helper function to get logo URL
  const getLogoUrl = (logo?: string | null) => {
    if (!logo) return null;
    const url = getFileUrl(logo);
    return url?.trim() || null;
  };

  useEffect(() => {
    if (company) {
      setPhone(company.phone || '');
      setAddress(company.address || '');
      setCodePostal(company.codePostal || '');
      // PDF Layout fields
      setEntete1(company.entete_1 || '');
      setEntete2(company.entete_2 || '');
      setEntete3(company.entete_3 || '');
      setPied1(company.pied_1 || '');
      setPied2(company.pied_2 || '');
      setPied3(company.pied_3 || '');
      // PDF Layout boolean settings
      setLogoLeft(company.logo_left ?? false);
      setLogoRight(company.logo_right ?? false);
      setPapierEntete(company.papier_entete ?? false);
    }
  }, [company]);

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setLogoError('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        return;
      }
      
      if (file.size > 2 * 1024 * 1024) {
        setLogoError('Image size must be less than 2MB');
        return;
      }
      
      setLogoFile(file);
      setLogoError(null);
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
      
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
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
        } catch {
          const updatedUserData = { ...user, company: { ...user.company, logo: null } };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
          window.dispatchEvent(new CustomEvent('company-updated'));
        }
      }
      
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
      
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      
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
        } catch {
          const updatedUserData = { ...user, company: updatedCompany };
          localStorage.setItem('user', JSON.stringify(updatedUserData));
          window.dispatchEvent(new CustomEvent('company-updated'));
        }
      }
      
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

  const handleSaveAll = async () => {
    if (!companyId || !company) return;
    
    setIsSaving(true);
    setError(null);
    setSuccess(false);
    
    try {
      const payload = {
        id: companyId,
        phone: phone.trim(),
        address: address.trim(),
        codePostal: codePostal.trim(),
        entete_1: entete1,
        entete_2: entete2,
        entete_3: entete3,
        pied_1: pied1,
        pied_2: pied2,
        pied_3: pied3,
        logo_left: logoLeft,
        logo_right: logoRight,
        papier_entete: papierEntete,
      };

      console.log('Saving all company settings with payload:', payload);

      await updateMutation.mutateAsync(payload);
      
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: unknown) {
      console.error('Save error:', error);
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const errorMessage = Array.isArray(axiosError?.response?.data?.message)
        ? axiosError.response.data.message.join(', ')
        : axiosError?.response?.data?.message || axiosError?.message || 'Failed to update company';
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = () => {
    if (!company) return false;
    return (
      phone !== (company.phone || '') ||
      address !== (company.address || '') ||
      codePostal !== (company.codePostal || '') ||
      entete1 !== (company.entete_1 || '') ||
      entete2 !== (company.entete_2 || '') ||
      entete3 !== (company.entete_3 || '') ||
      pied1 !== (company.pied_1 || '') ||
      pied2 !== (company.pied_2 || '') ||
      pied3 !== (company.pied_3 || '') ||
      logoLeft !== (company.logo_left ?? false) ||
      logoRight !== (company.logo_right ?? false) ||
      papierEntete !== (company.papier_entete ?? false)
    );
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

  // Toggle Switch Component
  const ToggleSwitch = ({ 
    checked, 
    onChange, 
    label, 
    description 
  }: { 
    checked: boolean; 
    onChange: (checked: boolean) => void; 
    label: string; 
    description?: string;
  }) => (
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex-shrink-0 mt-0.5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div className={`w-11 h-6 rounded-full transition-colors ${checked ? 'bg-primary' : 'bg-gray-300'}`}>
          <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
        </div>
      </div>
      <div className="flex-1">
        <span className="text-sm font-medium text-heading group-hover:text-primary transition-colors">
          {label}
        </span>
        {description && (
          <p className="text-xs text-muted mt-0.5">{description}</p>
        )}
      </div>
    </label>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-heading mb-4">
          {t('settings.companyInfo') || 'Company Information'}
        </h2>
        
        <div className="space-y-4">
          {/* Company Logo */}
          <div className="col-span-2">
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

          {/* Company Name */}
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

          {/* Email and Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          </div>

          {/* Address and Postal Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                {t('forms.address') || 'Address'}
              </label>
              <Input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t('forms.address') || 'Enter address'}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                {t('forms.postalCode') || 'Postal Code'}
              </label>
              <Input
                type="text"
                value={codePostal}
                onChange={(e) => setCodePostal(e.target.value)}
                placeholder={t('forms.postalCode') || 'Enter postal code'}
              />
            </div>
          </div>

          {/* Country and City */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                {t('forms.country') || 'Country'}
              </label>
              <Input
                type="text"
                value={company.country || ''}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted mb-1">
                {t('forms.city') || 'City'}
              </label>
              <Input
                type="text"
                value={company.city || ''}
                disabled
                className="bg-gray-50 cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PDF Layout Section */}
      <div className="pt-6 border-t border-tertiary/20">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-heading">
            {t('settings.pdfLayoutSettings') || 'PDF Layout Settings'}
          </h2>
        </div>

        {/* PDF Settings Toggles */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <ToggleSwitch
              checked={logoLeft}
              onChange={setLogoLeft}
              label={t('settings.logoLeft') || 'Logo on Left'}
              description={t('settings.logoLeftDesc') || 'Show logo on the left side of PDF header'}
            />
            
            <ToggleSwitch
              checked={logoRight}
              onChange={setLogoRight}
              label={t('settings.logoRight') || 'Logo on Right'}
              description={t('settings.logoRightDesc') || 'Show logo on the right side of PDF header'}
            />
            
            <ToggleSwitch
              checked={papierEntete}
              onChange={setPapierEntete}
              label={t('settings.papierEntete') || 'Letterhead Mode'}
              description={t('settings.papierEnteteDesc') || 'Show header & footer text in PDF documents'}
            />
          </div>
        </div>

        {/* Header/Footer Inputs - Only show when papierEntete is enabled */}
        {papierEntete ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Headers (Entêtes) */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-heading">
                {t('settings.documentHeaders') || 'Document Headers'}
              </h3>
              <Input
                type="text"
                value={entete1}
                onChange={(e) => setEntete1(e.target.value)}
                placeholder={t('settings.header1') || 'Header 1'}
                className="text-sm"
              />
              <Input
                type="text"
                value={entete2}
                onChange={(e) => setEntete2(e.target.value)}
                placeholder={t('settings.header2') || 'Header 2'}
                className="text-sm"
              />
              <Input
                type="text"
                value={entete3}
                onChange={(e) => setEntete3(e.target.value)}
                placeholder={t('settings.header3') || 'Header 3'}
                className="text-sm"
              />
            </div>

            {/* Footers (Pieds) */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-heading">
                {t('settings.documentFooters') || 'Document Footers'}
              </h3>
              <Input
                type="text"
                value={pied1}
                onChange={(e) => setPied1(e.target.value)}
                placeholder={t('settings.footer1') || 'Footer 1'}
                className="text-sm"
              />
              <Input
                type="text"
                value={pied2}
                onChange={(e) => setPied2(e.target.value)}
                placeholder={t('settings.footer2') || 'Footer 2'}
                className="text-sm"
              />
              <Input
                type="text"
                value={pied3}
                onChange={(e) => setPied3(e.target.value)}
                placeholder={t('settings.footer3') || 'Footer 3'}
                className="text-sm"
              />
            </div>
          </div>
        ) : (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
            <p className="text-sm text-blue-800">
              {t('settings.enableLetterheadHint') || 'Enable "Letterhead Mode" above to customize header and footer content for your PDF documents.'}
            </p>
          </div>
        )}
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-6 mt-6 border-t border-tertiary/20 sticky bottom-0 bg-surface py-4 z-[999]">
        <div className="flex-1">
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2 mb-2">
              {error}
            </div>
          )}
          {success && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-2 mb-2">
              {t('settings.companyUpdated') || 'Company settings updated successfully'}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="primary"
          onClick={handleSaveAll}
          disabled={isSaving || !hasChanges()}
        >
          {isSaving ? t('common.saving') || 'Saving...' : t('common.saveChanges') || 'Save Changes'}
        </Button>
      </div>
    </div>
  );
};

export default CompanySettings;
