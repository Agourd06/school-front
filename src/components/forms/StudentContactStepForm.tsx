import React, { useState, useEffect } from 'react';
import { Input, Select, Button } from '../ui';
import SearchSelect from '../inputs/SearchSelect';
import { countriesApi } from '../../api/countries';
import type { ContactFormData } from '../modals/student/types';
import type { StudentLinkType } from '../../api/studentLinkType';
import type { PaginatedResponse } from '../../types/api';

interface StudentContactStepFormProps {
  form: ContactFormData;
  errors: Record<string, string>;
  linkTypesData: PaginatedResponse<StudentLinkType> | null | undefined;
  studentName: string;
  onFormChange: (field: keyof ContactFormData, value: string | number | '') => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  hasContact: boolean;
  justSaved?: boolean;
  onAddAnother?: () => void;
  onContinue?: () => void;
}

const StudentContactStepForm: React.FC<StudentContactStepFormProps> = ({
  form,
  errors,
  linkTypesData,
  studentName,
  onFormChange,
  onSubmit,
  onBack,
  onSkip,
  isSubmitting,
  hasContact,
  justSaved = false,
  onAddAnother,
  onContinue,
}) => {
  const [countries, setCountries] = useState<Array<{ name: string }>>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load countries on mount
  useEffect(() => {
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

  // Load cities when country changes
  useEffect(() => {
    if (form.country) {
      const loadCities = async () => {
        setLoadingCities(true);
        setCities([]);
        onFormChange('city', ''); // Reset city when country changes
        try {
          const citiesList = await countriesApi.getCities(form.country);
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
      onFormChange('city', '');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country]);

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.form && <p className="text-sm text-danger">{errors.form}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Student"
          value={studentName}
          disabled
          className="bg-muted-foreground border-border"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          value={form.firstname}
          onChange={(e) => onFormChange('firstname', e.target.value)}
          error={errors.firstname}
        />
        <Input
          label="Last name"
          value={form.lastname}
          onChange={(e) => onFormChange('lastname', e.target.value)}
          error={errors.lastname}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Birthday"
          type="date"
          value={form.birthday}
          onChange={(e) => onFormChange('birthday', e.target.value)}
          max={new Date().toISOString().split('T')[0]}
        />
        <Input
          label="Email"
          type="email"
          value={form.email}
          onChange={(e) => onFormChange('email', e.target.value)}
          error={errors.email}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone"
          value={form.phone}
          onChange={(e) => onFormChange('phone', e.target.value)}
        />
        <Select
          label="Link type"
          value={form.studentlinktypeId}
          onChange={(e) => onFormChange('studentlinktypeId', e.target.value ? Number(e.target.value) : '')}
          options={[
            { value: '', label: 'Select link type' },
            ...((linkTypesData?.data || []).map((lt: StudentLinkType) => ({
              value: lt.id,
              label: lt.title,
            })))
          ]}
        />
      </div>

      <Input
        label="Address"
        value={form.adress}
        onChange={(e) => onFormChange('adress', e.target.value)}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchSelect
          label="Country"
          value={form.country || ''}
          onChange={(value) => onFormChange('country', value as string)}
          options={countries.map((country) => ({
            value: country.name,
            label: country.name,
          }))}
          placeholder={loadingCountries ? 'Loading countries...' : 'Search country...'}
          isLoading={loadingCountries}
        />
        <SearchSelect
          label="City"
          value={form.city || ''}
          onChange={(value) => onFormChange('city', value as string)}
          options={cities.map((city) => ({
            value: city,
            label: city,
          }))}
          placeholder={!form.country ? 'Select a country first' : loadingCities ? 'Loading cities...' : 'Search city...'}
          disabled={!form.country || loadingCities}
          isLoading={loadingCities}
        />
      </div>

      {justSaved && onAddAnother && onContinue ? (
        <div className="rounded-md border border-green-300 bg-green-50 px-3 py-2 text-sm text-green-800 mb-4">
          Contact saved successfully!
        </div>
      ) : null}
      <div className="flex justify-between space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={justSaved}
        >
          Back
        </Button>
        <div className="flex space-x-3">
          {!justSaved && (
            <Button
              type="button"
              variant="secondary"
              onClick={onSkip}
            >
              Skip
            </Button>
          )}
          {justSaved && onAddAnother && onContinue ? (
            <>
              <Button
                type="button"
                variant="secondary"
                onClick={onAddAnother}
              >
                Add Another
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={onContinue}
              >
                Continue
              </Button>
            </>
          ) : (
            <Button
              type="submit"
              variant="primary"
              isLoading={isSubmitting}
              disabled={isSubmitting}
            >
              {hasContact ? 'Update & Continue' : 'Save & Continue'}
            </Button>
          )}
        </div>
      </div>
    </form>
  );
};

export default StudentContactStepForm;

