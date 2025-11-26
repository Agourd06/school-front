import React from 'react';

export interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  website: string;
}

interface CompanyFormProps {
  data: CompanyFormData;
  onChange: (data: CompanyFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
}

const CompanyForm: React.FC<CompanyFormProps> = ({ data, onChange, onSubmit, loading }) => {
  const handleChange = (field: keyof CompanyFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Your Company</h2>
        <p className="text-gray-600">Start by setting up your organization's profile</p>
      </div>

      <div>
        <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          id="company-name"
          type="text"
          required
          value={data.name}
          onChange={handleChange('name')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          placeholder="Acme Schools"
        />
      </div>

      <div>
        <label htmlFor="company-email" className="block text-sm font-medium text-gray-700 mb-2">
          Company Email <span className="text-red-500">*</span>
        </label>
        <input
          id="company-email"
          type="email"
          required
          value={data.email}
          onChange={handleChange('email')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          placeholder="contact@acmeschools.com"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company-phone" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            id="company-phone"
            type="tel"
            value={data.phone}
            onChange={handleChange('phone')}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="+1-444-555-1212"
          />
        </div>

        <div>
          <label htmlFor="company-website" className="block text-sm font-medium text-gray-700 mb-2">
            Website
          </label>
          <input
            id="company-website"
            type="url"
            value={data.website}
            onChange={handleChange('website')}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
            placeholder="https://acmeschools.com"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Creating...' : 'Continue to User Account'}
      </button>
    </form>
  );
};

export default CompanyForm;

