import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { countriesApi } from '../../api/countries';
import Captcha from './Captcha';
import PhoneInput from '../inputs/PhoneInput';

export interface CombinedRegistrationFormData {
  // Company fields only
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  country: string;
  city: string;
  // Legal agreements
  acceptedPrivacyPolicy: boolean;
  acceptedTermsOfUse: boolean;
  // Username and email are auto-generated from company data
  // Password is NEVER provided - backend always sends password setup email
}

interface CombinedRegistrationFormProps {
  data: CombinedRegistrationFormData;
  onChange: (data: CombinedRegistrationFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  captchaToken?: string;
  captchaAnswer?: string;
  onCaptchaVerify?: (token: string, answer: string) => Promise<void>;
  captchaError?: string;
}


const CombinedRegistrationForm: React.FC<CombinedRegistrationFormProps> = ({
  data,
  onChange,
  onSubmit,
  loading,
  captchaToken,
  captchaAnswer,
  onCaptchaVerify,
  captchaError,
}) => {
  const { t } = useTranslation();
  const [countries, setCountries] = useState<Array<{ name: string }>>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  useEffect(() => {
    // Load countries on mount
    const loadCountries = async () => {
      setLoadingCountries(true);
      try {
        const countriesList = await countriesApi.getCountries();
        setCountries(countriesList.sort((a, b) => a.name.localeCompare(b.name)));
      } catch (error) {
        console.error('Failed to load countries:', error);
      } finally {
        setLoadingCountries(false);
      }
    };
    loadCountries();
  }, []);

  useEffect(() => {
    // Load cities when country changes
    if (data.country) {
      const loadCities = async () => {
        setLoadingCities(true);
        setCities([]);
        onChange({ ...data, city: '' }); // Reset city when country changes
        try {
          const citiesList = await countriesApi.getCities(data.country);
          setCities(citiesList);
        } catch (error) {
          console.error('Failed to load cities:', error);
        } finally {
          setLoadingCities(false);
        }
      };
      loadCities();
    } else {
      setCities([]);
      onChange({ ...data, city: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.country]);

  const handleChange = (field: keyof CombinedRegistrationFormData) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    onChange({ ...data, [field]: e.target.value });
  };

  const handleCheckboxChange = (field: 'acceptedPrivacyPolicy' | 'acceptedTermsOfUse') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ ...data, [field]: e.target.checked });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 text-body">
      <div>
        <h2 className="text-2xl font-bold text-heading mb-2">{t('registration.createYourAccount')}</h2>
        <p className="text-muted">{t('registration.setUpCompanyAndAdmin')}</p>
      </div>

      {/* Company Section */}
      <div className="space-y-5 pb-6 border-b border-tertiary/30">
        <div>
          <h3 className="text-lg font-semibold text-heading mb-1">{t('registration.companyInformation')}</h3>
          <p className="text-xs text-muted">{t('registration.companyInformationDescription') || 'Enter your school or organization details'}</p>
        </div>

        <div>
          <label htmlFor="company-name" className="block text-sm font-semibold text-heading mb-2">
            {t('registration.companyName')} <span className="text-danger">*</span>
          </label>
          <input
            id="company-name"
            type="text"
            required
            value={data.companyName}
            onChange={handleChange('companyName')}
            className="w-full rounded-xl border border-primary/60 px-4 py-3 text-sm text-heading placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all duration-200 bg-white hover:border-primary"
            placeholder={t('registration.companyNamePlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="company-email" className="block text-sm font-semibold text-heading mb-2">
            {t('registration.companyEmail')} <span className="text-danger">*</span>
          </label>
          <input
            id="company-email"
            type="email"
            required
            value={data.companyEmail}
            onChange={handleChange('companyEmail')}
            className="w-full rounded-xl border border-primary/60 px-4 py-3 text-sm text-heading placeholder:text-muted/60 focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all duration-200 bg-white hover:border-primary"
            placeholder={t('registration.companyEmailPlaceholder')}
          />
          <p className="mt-1.5 text-xs text-muted">
            {t('registration.companyEmailNote') || 'This email will also be used for your administrator account'}
          </p>
        </div>

        <div>
          <PhoneInput
            label={t('registration.phoneNumber')}
            name="companyPhone"
            value={data.companyPhone}
            onChange={handleChange('companyPhone')}
            placeholder={t('registration.phonePlaceholder')}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="company-country" className="block text-sm font-medium text-heading mb-2">
              {t('forms.country')}
            </label>
            <select
              id="company-country"
              value={data.country}
              onChange={handleChange('country')}
              className="w-full rounded-xl border border-primary/60 px-4 py-3 text-sm text-heading focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all duration-200 bg-white hover:border-primary custom-select"
            >
              <option value="">{t('registration.selectACountry')}</option>
              {loadingCountries ? (
                <option disabled>{t('registration.loadingCountries')}</option>
              ) : (
                countries.map((country) => (
                  <option key={country.name} value={country.name}>
                    {country.name}
                  </option>
                ))
              )}
            </select>
          </div>

          <div>
            <label htmlFor="company-city" className="block text-sm font-medium text-heading mb-2">
              {t('forms.city')}
            </label>
            <select
              id="company-city"
              value={data.city}
              onChange={handleChange('city')}
              disabled={!data.country || loadingCities}
              className="w-full rounded-xl border border-primary/60 px-4 py-3 text-sm text-heading focus:border-primary focus:ring-2 focus:ring-primary/10 focus:outline-none transition-all duration-200 bg-white hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed custom-select"
            >
              <option value="">
                {!data.country
                  ? t('registration.selectCountryFirst')
                  : loadingCities
                  ? t('registration.loadingCities')
                  : t('registration.selectACity')}
              </option>
              {cities.map((city) => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Legal Agreements */}
      <div className="space-y-4 pt-2">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="privacy-policy"
              checked={data.acceptedPrivacyPolicy}
              onChange={handleCheckboxChange('acceptedPrivacyPolicy')}
              className="mt-1 h-4 w-4 text-primary border-primary/60 rounded focus:ring-2 focus:ring-primary/20 cursor-pointer"
              required
            />
            <label htmlFor="privacy-policy" className="text-sm text-heading cursor-pointer flex-1">
              {t('registration.iHaveReadAndAgreeTo') || 'I have read and agree to the'}{' '}
              <a
                href="/privacy-policy"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t('registration.privacyPolicy') || 'Privacy Policy'}
              </a>
            </label>
          </div>

          <div className="flex items-start gap-3">
            <input
              type="checkbox"
              id="terms-of-use"
              checked={data.acceptedTermsOfUse}
              onChange={handleCheckboxChange('acceptedTermsOfUse')}
              className="mt-1 h-4 w-4 text-primary border-primary/60 rounded focus:ring-2 focus:ring-primary/20 cursor-pointer"
              required
            />
            <label htmlFor="terms-of-use" className="text-sm text-heading cursor-pointer flex-1">
              {t('registration.iHaveReadAndAgreeTo') || 'I have read and agree to the'}{' '}
              <a
                href="/terms-of-use"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-semibold hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {t('registration.termsOfUse') || 'Terms of Use'}
              </a>
            </label>
          </div>
        </div>

        {/* CAPTCHA - Only show after both checkboxes are accepted */}
        {data.acceptedPrivacyPolicy && data.acceptedTermsOfUse && onCaptchaVerify && (
          <div className="pt-2">
            <Captcha
              onVerify={onCaptchaVerify}
              onError={() => {
                // Error is handled by parent component
              }}
              disabled={loading}
              isVerified={!!captchaToken && captchaAnswer !== undefined}
            />
            {captchaError && (
              <div className="mt-2 text-sm text-danger bg-danger/10 border border-danger/20 rounded-lg p-2.5" role="alert">
                {captchaError}
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="submit"
        disabled={
          loading || 
          !data.companyName.trim() || 
          !data.companyEmail.trim() || 
          !data.acceptedPrivacyPolicy || 
          !data.acceptedTermsOfUse ||
          !captchaToken ||
          captchaAnswer === undefined
        }
        className="w-full bg-primary text-primary-foreground py-3.5 px-4 rounded-xl font-semibold hover:bg-primary/95 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {t('registration.creatingAccount')}
          </span>
        ) : (
          t('registration.createAccount')
        )}
      </button>
    </form>
  );
};

export default CombinedRegistrationForm;

