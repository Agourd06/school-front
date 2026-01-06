import React, { useState, useEffect, useRef, useId } from 'react';
import { validateRequired } from '../modals/validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { getFileUrl } from '../../utils/apiConfig';
import { Input, Select, Button } from '../ui';
import PhoneInput from '../inputs/PhoneInput';
import SearchSelect from '../inputs/SearchSelect';
import { countriesApi } from '../../api/countries';

export interface TeacherFormData {
  gender: string;
  first_name: string;
  last_name: string;
  birthday: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  nationality: string;
  picture: string;
  status: number;
}

export interface Teacher {
  id: number;
  gender?: string;
  first_name: string;
  last_name: string;
  birthday?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  nationality?: string;
  picture?: string;
  status: number;
}

interface TeacherFormProps {
  initialData?: Teacher | null;
  onSubmit: (data: TeacherFormData, pictureFile: File | null) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
}

const TeacherForm: React.FC<TeacherFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
}) => {
  // Track the initial data ID to prevent unnecessary resets
  const initialDataIdRef = useRef<number | null>(null);
  const isInitializedRef = useRef(false);

  const [form, setForm] = useState<TeacherFormData>({
    gender: '',
    first_name: '',
    last_name: '',
    birthday: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    nationality: '',
    picture: '',
    status: 2, // Default to pending (2) for new teachers
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pictureInputId = useId();
  const [countries, setCountries] = useState<Array<{ name: string }>>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Update errors when serverError changes (for email duplicate errors)
  useEffect(() => {
    if (serverError) {
      const messageLower = serverError.toLowerCase();
      if (
        messageLower.includes('email') ||
        messageLower.includes('teacher with email') ||
        messageLower.includes('user with email') ||
        messageLower.includes('already exists')
      ) {
        // Set error on email field for better UX
        setErrors((prev) => ({ ...prev, email: serverError }));
      } else {
        // For other errors, keep them in serverError (displayed above form)
        setErrors((prev) => ({ ...prev, form: serverError }));
      }
    } else {
      // Clear form error when serverError is cleared
      setErrors((prev) => {
        const { form: _, ...rest } = prev;
        return rest;
      });
    }
  }, [serverError]);

  useEffect(() => {
    // Get the current initialData ID (or null if no initialData)
    const currentInitialDataId = initialData?.id ?? null;
    
    // Only reset form if:
    // 1. We haven't initialized yet, OR
    // 2. The initialData ID has changed (different record being edited)
    const shouldReset = !isInitializedRef.current || initialDataIdRef.current !== currentInitialDataId;

    if (shouldReset) {
      if (initialData) {
        setForm({
          gender: initialData.gender || '',
          first_name: initialData.first_name || '',
          last_name: initialData.last_name || '',
          birthday: initialData.birthday || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          city: initialData.city || '',
          country: initialData.country || '',
          nationality: initialData.nationality || '',
          picture: initialData.picture || '',
          status: typeof initialData.status === 'number' ? initialData.status : 2,
        });
      } else {
        setForm({
          gender: '',
          first_name: '',
          last_name: '',
          birthday: '',
          email: '',
          phone: '',
          address: '',
          city: '',
          country: '',
          nationality: '',
          picture: '',
          status: 2, // Default to pending (2) for new teachers
        });
      }
      setErrors({});
      setPictureFile(null);
      
      // Update refs
      initialDataIdRef.current = currentInitialDataId;
      isInitializedRef.current = true;
    }

    // Reset refs when initialData becomes null/undefined (modal closed)
    if (!initialData && isInitializedRef.current) {
      initialDataIdRef.current = null;
      isInitializedRef.current = false;
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === 'status' ? Number(value) : value,
    }));
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setPictureFile(null);
      setPreviewUrl(null);
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrors((prev) => ({ ...prev, picture: 'Invalid file type. Allowed: jpeg, png, gif, webp' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, picture: 'File too large. Max 2MB' }));
      return;
    }
    setErrors((prev) => ({ ...prev, picture: '' }));
    setPictureFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Show preview of existing picture
  useEffect(() => {
    if (initialData?.picture && !pictureFile) {
      setPreviewUrl(getFileUrl(initialData.picture));
    } else if (!pictureFile) {
      setPreviewUrl(null);
    }
  }, [initialData?.picture, pictureFile]);

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
    handleChange(fakeEvent);
    // Clear city when country changes
    setForm((prev) => ({ ...prev, city: '' }));
  };

  const handleCityChange = (value: number | string | '') => {
    const fakeEvent = {
      target: { name: 'city', value: String(value) },
    } as React.ChangeEvent<HTMLSelectElement>;
    handleChange(fakeEvent);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const fnErr = validateRequired(form.first_name, 'First name');
    if (fnErr) newErrors.first_name = fnErr;
    const lnErr = validateRequired(form.last_name, 'Last name');
    if (lnErr) newErrors.last_name = lnErr;
    const emailErr = validateRequired(form.email, 'Email');
    if (emailErr) newErrors.email = emailErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form, pictureFile);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
              alt="Teacher picture preview"
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
            onChange={handlePictureChange}
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
          onChange={handleChange}
          error={errors.email}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
        <PhoneInput
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
          error={errors.phone}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          name="first_name"
          value={form.first_name}
          onChange={handleChange}
          error={errors.first_name}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
        <Input
          label="Last name"
          name="last_name"
          value={form.last_name}
          onChange={handleChange}
          error={errors.last_name}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Select
          label="Gender"
          name="gender"
          value={form.gender}
          onChange={handleChange}
          options={[
            { value: '', label: 'Select' },
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
        <Input
          label="Birthday"
          type="date"
          name="birthday"
          value={form.birthday}
          onChange={handleChange}
          max={new Date().toISOString().split('T')[0]}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
        <Input
          label="Nationality"
          name="nationality"
          value={form.nationality}
          onChange={handleChange}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
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

      {/* Only show status field when editing */}
      {initialData && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={STATUS_OPTIONS_FORM.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
          />
        </div>
      )}
      
      {/* Show helper text for new teachers */}
      {!initialData && (
        <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-sm text-blue-800">
          <strong>Note:</strong> New teachers are created with <strong>Pending</strong> status. A password invitation email can be sent to set their password.
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default TeacherForm;

