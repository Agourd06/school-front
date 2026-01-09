import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { countriesApi } from '../../api/countries';

export interface CombinedRegistrationFormData {
  // Company fields
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  country: string;
  city: string;
  // User fields
  username: string;
  userEmail: string;
}

interface CombinedRegistrationFormProps {
  data: CombinedRegistrationFormData;
  onChange: (data: CombinedRegistrationFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

const CombinedRegistrationForm: React.FC<CombinedRegistrationFormProps> = ({
  data,
  onChange,
  onSubmit,
  loading,
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

  return (
    <form onSubmit={onSubmit} className="space-y-6 text-body">
      <div>
        <h2 className="text-2xl font-bold text-heading mb-2">{t('registration.createYourAccount')}</h2>
        <p className="text-muted">{t('registration.setUpCompanyAndAdmin')}</p>
      </div>

      {/* Company Section */}
      <div className="space-y-4 pb-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-heading">{t('registration.companyInformation')}</h3>

        <div>
          <label htmlFor="company-name" className="block text-sm font-medium text-heading mb-2">
            {t('registration.companyName')} <span className="text-red-500">*</span>
          </label>
          <input
            id="company-name"
            type="text"
            required
            value={data.companyName}
            onChange={handleChange('companyName')}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
            placeholder={t('registration.companyNamePlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="company-email" className="block text-sm font-medium text-heading mb-2">
            {t('registration.companyEmail')} <span className="text-red-500">*</span>
          </label>
          <input
            id="company-email"
            type="email"
            required
            value={data.companyEmail}
            onChange={handleChange('companyEmail')}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
            placeholder={t('registration.companyEmailPlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="company-phone" className="block text-sm font-medium text-heading mb-2">
            {t('registration.phoneNumber')}
          </label>
          <input
            id="company-phone"
            type="tel"
            value={data.companyPhone}
            onChange={handleChange('companyPhone')}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
            placeholder={t('registration.phonePlaceholder')}
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
              className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
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
              className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card disabled:opacity-50 disabled:cursor-not-allowed"
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

      {/* User Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-heading">{t('registration.administratorAccount')}</h3>
        <p className="text-sm text-muted">
          {t('registration.accountWillBeCreatedWithAdminProfile')}
        </p>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-heading mb-2">
            {t('registration.username')} <span className="text-red-500">*</span>
          </label>
          <input
            id="username"
            type="text"
            required
            value={data.username}
            onChange={handleChange('username')}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
            placeholder={t('registration.usernamePlaceholder')}
          />
        </div>

        <div>
          <label htmlFor="user-email" className="block text-sm font-medium text-heading mb-2">
            {t('forms.email')} <span className="text-red-500">*</span>
          </label>
          <input
            id="user-email"
            type="email"
            required
            value={data.userEmail}
            onChange={handleChange('userEmail')}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
            placeholder={t('registration.userEmailPlaceholder')}
          />
          <p className="mt-1 text-xs text-muted">
            {t('registration.invitationEmailNote')}
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? t('registration.creatingAccount') : t('registration.createAccount')}
      </button>
    </form>
  );
};

export default CombinedRegistrationForm;

