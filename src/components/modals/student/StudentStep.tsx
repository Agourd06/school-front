import React, { useState, useEffect, useId } from 'react';
import { STATUS_OPTIONS_FORM } from '../../../constants/status';
import { getFileUrl } from '../../../utils/apiConfig';
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
          <label
            htmlFor={pictureInputId}
            className="block text-sm font-medium text-gray-700"
          >
            Upload new picture
          </label>
          <input
            id={pictureInputId}
            name="picture"
            type="file"
            accept="image/*"
            onChange={onPictureChange}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG, GIF, WEBP up to 2MB.
          </p>
          {errors.picture && <p className="mt-1 text-xs text-red-600">{errors.picture}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First name</label>
          <input
            name="first_name"
            value={form.first_name}
            onChange={onChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              errors.first_name ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last name</label>
          <input
            name="last_name"
            value={form.last_name}
            onChange={onChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              errors.last_name ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select
            name="gender"
            value={form.gender}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Birthday</label>
          <input
            type="date"
            name="birthday"
            value={form.birthday}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input
          name="address"
          value={form.address}
          onChange={onChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            name="city"
            value={form.city}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input
            name="country"
            value={form.country}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nationality</label>
          <input
            name="nationality"
            value={form.nationality}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            name="status"
            value={form.status}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {STATUS_OPTIONS_FORM.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Class Room</label>
          <select
            name="class_room_id"
            value={form.class_room_id}
            onChange={onChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">No class room</option>
            {(classRooms?.data || []).map((cr: any) => (
              <option key={cr.id} value={cr.id}>
                {cr.code} — {cr.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : 'Update & Continue'}
        </button>
      </div>
    </form>
  );
};

export default StudentStep;

