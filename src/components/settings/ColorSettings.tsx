import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { companyApi } from '../../api/company';
import { useAuth } from '../../hooks/useAuth';
import { applyThemeToDocument, mergeTheme, defaultTheme } from '../../theme/colors';
import Button from '../ui/Button';

interface ColorSettingsProps {
  onSuccess?: () => void;
}

const ColorSettings: React.FC<ColorSettingsProps> = ({ onSuccess }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [primaryColor, setPrimaryColor] = useState(defaultTheme.primary);
  const [secondaryColor, setSecondaryColor] = useState(defaultTheme.secondary);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadCompanyColors();
  }, []);

  useEffect(() => {
    // Apply colors to preview
    applyThemeToDocument(
      mergeTheme({
        primary: primaryColor,
        secondary: secondaryColor,
        accent: secondaryColor,
      })
    );
  }, [primaryColor, secondaryColor]);

  const loadCompanyColors = async () => {
    if (!user?.company_id) return;

    try {
      setLoading(true);
      const company = await companyApi.getById(user.company_id);
      if (company.primaryColor) {
        setPrimaryColor(company.primaryColor);
      }
      if (company.secondaryColor) {
        setSecondaryColor(company.secondaryColor);
      }
    } catch (err) {
      console.error('Failed to load company colors', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user?.company_id) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(false);

      await companyApi.update(user.company_id, {
        primaryColor,
        secondaryColor,
      });

      setSuccess(true);
      onSuccess?.();
      
      // Reset success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || t('settings.failedToSaveColors');
      setError(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-gray-500">{t('settings.loadingColorSettings')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('settings.companyColors')}</h3>
        <p className="text-sm text-gray-600">
          {t('settings.customizeBrandColors')}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
          {t('settings.colorsSavedSuccessfully')}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <label htmlFor="primary-color" className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.primaryColor')}
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4">
            <input
              id="primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-12 w-12 rounded-lg border border-gray-300 bg-white shadow-sm cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.brandAccentsButtons')}</p>
              <p className="text-xs text-gray-500">{t('settings.usedForPrimaryActions')}</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">{primaryColor}</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="secondary-color" className="block text-sm font-medium text-gray-700 mb-2">
            {t('settings.secondaryColor')}
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-4">
            <input
              id="secondary-color"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-12 w-12 rounded-lg border border-gray-300 bg-white shadow-sm cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{t('settings.highlightsLinks')}</p>
              <p className="text-xs text-gray-500">{t('settings.usedForSecondaryButtons')}</p>
              <p className="text-xs text-gray-400 mt-1 font-mono">{secondaryColor}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-6"
        >
          {saving ? t('settings.saving') : t('settings.saveColors')}
        </Button>
      </div>
    </div>
  );
};

export default ColorSettings;

