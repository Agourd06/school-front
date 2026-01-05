import React, { useState, useEffect, useRef, useId } from 'react';
import { validateRequired } from '../modals/validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { getFileUrl } from '../../utils/apiConfig';
import { Input, Select, Button } from '../ui';

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
  class_room_id: number | '';
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
  class_room_id?: number | null;
}

interface TeacherFormProps {
  initialData?: Teacher | null;
  onSubmit: (data: TeacherFormData, pictureFile: File | null) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  classRooms: Array<{ id: number; code: string; title: string }>;
}

const TeacherForm: React.FC<TeacherFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  classRooms,
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
    status: 1,
    class_room_id: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pictureInputId = useId();

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
          status: typeof initialData.status === 'number' ? initialData.status : 1,
          class_room_id: initialData.class_room_id ?? '',
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
          status: 1,
          class_room_id: '',
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
      [name]:
        name === 'class_room_id'
          ? value
            ? Number(value)
            : ''
          : name === 'status'
          ? Number(value)
          : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
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
      {serverError && (
        <div className="rounded-md border border-danger-light bg-danger-light px-3 py-2 text-sm text-danger-dark">
          {serverError}
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
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="City"
          name="city"
          value={form.city}
          onChange={handleChange}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
        <Input
          label="Country"
          name="country"
          value={form.country}
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
        <Select
          label="Class Room"
          name="class_room_id"
          value={form.class_room_id}
          onChange={handleChange}
          options={[
            { value: '', label: 'No class room' },
            ...classRooms.map((cr) => ({
              value: cr.id,
              label: `${cr.code} — ${cr.title}`,
            })),
          ]}
          className="shadow-sm focus:outline-none focus:ring-primary focus:border-primary sm:text-sm"
        />
      </div>

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

