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
  const [tertiaryColor, setTertiaryColor] = useState(defaultTheme.tertiary);
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
        tertiary: tertiaryColor,
        accent: secondaryColor,
      })
    );
  }, [primaryColor, secondaryColor, tertiaryColor]);

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
      if (company.tertiaryColor) {
        setTertiaryColor(company.tertiaryColor);
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
        tertiaryColor,
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
        <h3 className="text-lg font-semibold text-heading mb-2">{t('settings.companyColors')}</h3>
        <p className="text-sm text-body">
          {t('settings.customizeBrandColors')}
        </p>
      </div>

      {error && (
        <div className="bg-danger-light border border-danger text-danger-dark px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-light border border-success text-success-dark px-4 py-3 rounded-lg">
          {t('settings.colorsSavedSuccessfully')}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div>
          <label htmlFor="primary-color" className="block text-sm font-medium text-heading mb-2">
            {t('settings.primaryColor')}
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white px-4 py-4">
            <input
              id="primary-color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className="h-12 w-12 rounded-lg border border-primary bg-white shadow-sm cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-heading">{t('settings.brandAccentsButtons')}</p>
              <p className="text-xs text-body">{t('settings.usedForPrimaryActions')}</p>
              <p className="text-xs text-muted mt-1 font-mono">{primaryColor}</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="secondary-color" className="block text-sm font-medium text-heading mb-2">
            {t('settings.secondaryColor')}
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white px-4 py-4">
            <input
              id="secondary-color"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className="h-12 w-12 rounded-lg border border-primary bg-white shadow-sm cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-heading">{t('settings.highlightsLinks')}</p>
              <p className="text-xs text-body">{t('settings.usedForSecondaryButtons')}</p>
              <p className="text-xs text-muted mt-1 font-mono">{secondaryColor}</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="tertiary-color" className="block text-sm font-medium text-heading mb-2">
            {t('settings.tertiaryColor') || 'Tertiary Color'}
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-primary/20 bg-white px-4 py-4">
            <input
              id="tertiary-color"
              type="color"
              value={tertiaryColor}
              onChange={(e) => setTertiaryColor(e.target.value)}
              className="h-12 w-12 rounded-lg border border-primary bg-white shadow-sm cursor-pointer"
            />
            <div>
              <p className="text-sm font-medium text-heading">{t('settings.smallAccentLines') || 'Small Accent Lines'}</p>
              <p className="text-xs text-body">{t('settings.usedForSmallLines') || 'Used for dividers, underlines, and small decorative borders'}</p>
              <p className="text-xs text-muted mt-1 font-mono">{tertiaryColor}</p>
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

