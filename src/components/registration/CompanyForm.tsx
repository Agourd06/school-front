import React from 'react';

export interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  primaryColor: string;
  secondaryColor: string;
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
    <form onSubmit={onSubmit} className="space-y-6 text-body">
      <div>
        <h2 className="text-2xl font-bold text-heading mb-2">Create Your Company</h2>
        <p className="text-muted">Start by setting up your organization's profile</p>
      </div>

      <div>
        <label htmlFor="company-name" className="block text-sm font-medium text-heading mb-2">
          Company Name <span className="text-red-500">*</span>
        </label>
        <input
          id="company-name"
          type="text"
          required
          value={data.name}
          onChange={handleChange('name')}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
          placeholder="Acme Schools"
        />
      </div>

      <div>
        <label htmlFor="company-email" className="block text-sm font-medium text-heading mb-2">
          Company Email <span className="text-red-500">*</span>
        </label>
        <input
          id="company-email"
          type="email"
          required
          value={data.email}
          onChange={handleChange('email')}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
          placeholder="contact@acmeschools.com"
        />
      </div>

      <div>
        <label htmlFor="company-phone" className="block text-sm font-medium text-heading mb-2">
          Phone Number
        </label>
        <input
          id="company-phone"
          type="tel"
          value={data.phone}
          onChange={handleChange('phone')}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
          placeholder="+1-444-555-1212"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="company-primary-color" className="block text-sm font-medium text-heading mb-2">
            Primary color
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3">
            <input
              id="company-primary-color"
              type="color"
              value={data.primaryColor}
              onChange={handleChange('primaryColor')}
              className="h-12 w-12 rounded-lg border border-gray-300 bg-white shadow-sm"
            />
            <div>
              <p className="text-sm font-medium text-heading">Brand accents & buttons</p>
              <p className="text-xs text-muted">Used for primary actions everywhere</p>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="company-secondary-color" className="block text-sm font-medium text-heading mb-2">
            Secondary color
          </label>
          <div className="flex items-center gap-3 rounded-xl border border-border bg-surface px-3 py-3">
            <input
              id="company-secondary-color"
              type="color"
              value={data.secondaryColor}
              onChange={handleChange('secondaryColor')}
              className="h-12 w-12 rounded-lg border border-gray-300 bg-white shadow-sm"
            />
            <div>
              <p className="text-sm font-medium text-heading">Highlights & links</p>
              <p className="text-xs text-muted">Used for secondary buttons and states</p>
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Creating...' : 'Continue'}
      </button>
    </form>
  );
};

export default CompanyForm;

