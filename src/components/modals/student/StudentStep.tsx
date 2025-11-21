import React, { useState, useEffect, useId } from 'react';
import { STATUS_OPTIONS_FORM } from '../../../constants/status';
import { getFileUrl } from '../../../utils/apiConfig';
import { Input, Select, FileInput, Button } from '../../ui';
import type { StudentFormData } from './types';

interface StudentStepProps {
  form: StudentFormData;
  errors: Record<string, string>;
  pictureFile: File | null;
  currentPictureUrl?: string | null;
  classRooms: any;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  onPictureChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

const StudentStep: React.FC<StudentStepProps> = ({
  form,
  errors,
  pictureFile,
  currentPictureUrl,
  classRooms,
  onChange,
  onPictureChange,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const pictureInputId = useId();

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

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
      <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6">
        <div className="relative mx-auto sm:mx-0">
          {previewUrl ? (
            <img
              src={previewUrl}
              alt="Student picture preview"
              className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-blue-100"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50 text-xs font-medium text-gray-400">
              Add photo
            </div>
          )}
          <label
            htmlFor={pictureInputId}
            className="absolute bottom-0 right-0 inline-flex cursor-pointer items-center rounded-full bg-white/95 px-2 py-1 text-xs font-semibold text-blue-600 shadow"
          >
            Change
          </label>
        </div>
        <div className="mt-3 sm:mt-0 flex-1">
          <FileInput
            label="Upload new picture"
            name="picture"
            accept="image/*"
            onChange={(file) => {
              if (file) {
                const e = { target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>;
                onPictureChange(e);
              }
            }}
            currentFileUrl={previewUrl || undefined}
            error={errors.picture}
            helperText="JPG, PNG, GIF, WEBP up to 2MB."
            className="rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Email"
          name="email"
          type="email"
          value={form.email}
          onChange={onChange}
          error={errors.email}
        />
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={onChange}
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
        />
      </div>

      <Input
        label="Address"
        name="address"
        value={form.address}
        onChange={onChange}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="City"
          name="city"
          value={form.city}
          onChange={onChange}
        />
        <Input
          label="Country"
          name="country"
          value={form.country}
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
        <Select
          label="Class Room"
          name="class_room_id"
          value={form.class_room_id}
          onChange={onChange}
          options={[
            { value: '', label: 'No class room' },
            ...((classRooms?.data || []).map((cr: any) => ({
              value: cr.id,
              label: `${cr.code} — ${cr.title}`,
            })))
          ]}
        />
      </div>

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

export default StudentStep;

