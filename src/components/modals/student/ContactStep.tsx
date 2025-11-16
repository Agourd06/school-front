import React from 'react';
import type { ContactFormData } from './types';

interface ContactStepProps {
  form: ContactFormData;
  errors: Record<string, string>;
  linkTypesData: any;
  onFormChange: (field: keyof ContactFormData, value: any) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
  hasContact: boolean;
}

const ContactStep: React.FC<ContactStepProps> = ({
  form,
  errors,
  linkTypesData,
  onFormChange,
  onSubmit,
  onBack,
  onSkip,
  isSubmitting,
  hasContact,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First name</label>
          <input
            value={form.firstname}
            onChange={(e) => onFormChange('firstname', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              errors.firstname ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.firstname && <p className="text-sm text-red-600">{errors.firstname}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last name</label>
          <input
            value={form.lastname}
            onChange={(e) => onFormChange('lastname', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              errors.lastname ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.lastname && <p className="text-sm text-red-600">{errors.lastname}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Birthday</label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) => onFormChange('birthday', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onFormChange('email', e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${
              errors.email ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input
            value={form.phone}
            onChange={(e) => onFormChange('phone', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Link type</label>
          <select
            value={form.studentlinktypeId}
            onChange={(e) => onFormChange('studentlinktypeId', e.target.value ? Number(e.target.value) : '')}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value="">Select link type</option>
            {(linkTypesData?.data || []).map((lt: any) => (
              <option key={lt.id} value={lt.id}>
                {lt.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Adress</label>
          <input
            value={form.adress}
            onChange={(e) => onFormChange('adress', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input
            value={form.city}
            onChange={(e) => onFormChange('city', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input
            value={form.country}
            onChange={(e) => onFormChange('country', e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
      </div>

      <div className="flex justify-between space-x-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Back
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={onSkip}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Skip
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : hasContact ? 'Update & Continue' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </form>
  );
};

export default ContactStep;

