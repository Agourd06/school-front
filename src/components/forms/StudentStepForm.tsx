import React, { useState, useEffect, useId } from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { getFileUrl } from '../../utils/apiConfig';
import { Input, Select, Button } from '../ui';
import SearchSelect from '../inputs/SearchSelect';
import PhoneInput from '../inputs/PhoneInput';
import { countriesApi } from '../../api/countries';
import type { StudentFormData } from '../modals/student/types';

interface StudentStepFormProps {
  form: StudentFormData;
  errors: Record<string, string>;
  pictureFile: File | null;
  currentPictureUrl?: string | null;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPictureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
  isEditMode?: boolean;
}

const StudentStepForm: React.FC<StudentStepFormProps> = ({
  form,
  errors,
  pictureFile,
  currentPictureUrl,
  onChange,
  onPictureChange,
  onSubmit,
  onCancel,
  isSubmitting,
  isEditMode = false,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pictureInputId = useId();
  const [countries, setCountries] = useState<Array<{ name: string }>>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Show preview of newly selected file, or existing picture
  useEffect(() => {
    if (pictureFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(pictureFile);
    } else if (currentPictureUrl) {
      setPreviewUrl(getFileUrl(currentPictureUrl));
    } else {
      setPreviewUrl(null);
    }
  }, [pictureFile, currentPictureUrl]);

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
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.country]);

  // Handlers for SearchSelect (they use value callbacks instead of events)
  const handleCountryChange = (value: number | string | '') => {
    const fakeEvent = {
      target: { name: 'country', value: String(value) },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(fakeEvent);
  };

  const handleCityChange = (value: number | string | '') => {
    const fakeEvent = {
      target: { name: 'city', value: String(value) },
    } as React.ChangeEvent<HTMLSelectElement>;
    onChange(fakeEvent);
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.form && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {errors.form}
        </div>
      )}
      <div className="flex items-center gap-4">
        <div className="relative">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Student picture preview"
              className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-primary-light"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-border bg-surface text-xs font-medium text-muted">
              Add photo
            </div>
          )}
          <label
            htmlFor={pictureInputId}
            className="absolute bottom-0 right-0 inline-flex cursor-pointer items-center rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-primary shadow hover:bg-white transition-colors"
          >
            Change
          </label>
          <input
            id={pictureInputId}
            type="file"
            accept="image/*"
            onChange={onPictureChange}
            className="hidden"
          />
        </div>
        {errors.picture && (
          <p className="text-sm text-danger">{errors.picture}</p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          error={errors.email}
          helperText="A user account with profile 'student' will be automatically created and a password invitation email will be sent to this address."
        />
        <PhoneInput
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={onChange}
          error={errors.phone}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          name="first_name"
          value={form.first_name}
          onChange={onChange}
          error={errors.first_name}
        />
        <Input
          label="Last name"
          name="last_name"
          value={form.last_name}
          onChange={onChange}
          error={errors.last_name}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={onChange}
          options={[
            { value: '', label: 'Select' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
        />
        <Input
          label="Birthday"
          type="date"
          name="birthday"
          value={form.birthday}
          onChange={onChange}
          max={new Date().toISOString().split('T')[0]}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Address"
          name="address"
          value={form.address}
          onChange={onChange}
        />
        <Input
          label="Nationality"
          name="nationality"
          value={form.nationality}
          onChange={onChange}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <SearchSelect
          label="Country"
          value={form.country || ''}
          onChange={handleCountryChange}
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
          onChange={handleCityChange}
          options={cities.map((city) => ({
            value: city,
            label: city,
          }))}
          placeholder={!form.country ? 'Select a country first' : loadingCities ? 'Loading cities...' : 'Search city...'}
          disabled={!form.country || loadingCities}
          isLoading={loadingCities}
        />
      </div>

      {isEditMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={onChange}
            options={STATUS_OPTIONS_FORM.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />
        </div>
      )}
      {!isEditMode && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <strong>Note:</strong> New students are created with <strong>Pending</strong> status. They must set their password to become active.
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          disabled={isSubmitting}
        >
          Update & Continue
        </Button>
      </div>
    </form>
  );
};

export default StudentStepForm;

