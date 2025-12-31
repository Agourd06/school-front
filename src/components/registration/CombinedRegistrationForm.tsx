import React from 'react';

export interface CombinedRegistrationFormData {
  // Company fields
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  primaryColor: string;
  secondaryColor: string;
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
  const handleChange = (field: keyof CombinedRegistrationFormData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    onChange({ ...data, [field]: e.target.value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 text-body">
      <div>
        <h2 className="text-2xl font-bold text-heading mb-2">Create Your Account</h2>
        <p className="text-muted">Set up your company and administrator account</p>
      </div>

      {/* Company Section */}
      <div className="space-y-4 pb-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-heading">Company Information</h3>

        <div>
          <label htmlFor="company-name" className="block text-sm font-medium text-heading mb-2">
            Company Name <span className="text-red-500">*</span>
          </label>
          <input
            id="company-name"
            type="text"
            required
            value={data.companyName}
            onChange={handleChange('companyName')}
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
            value={data.companyEmail}
            onChange={handleChange('companyEmail')}
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
            value={data.companyPhone}
            onChange={handleChange('companyPhone')}
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
      </div>

      {/* User Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-heading">Administrator Account</h3>
        <p className="text-sm text-muted">
          Your account will be created with administrator profile (full access)
        </p>

        <div>
          <label htmlFor="username" className="block text-sm font-medium text-heading mb-2">
            Username <span className="text-red-500">*</span>
          </label>
          <input
            id="username"
            type="text"
            required
            value={data.username}
            onChange={handleChange('username')}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
            placeholder="jane.doe"
          />
        </div>

        <div>
          <label htmlFor="user-email" className="block text-sm font-medium text-heading mb-2">
            Email Address <span className="text-red-500">*</span>
          </label>
          <input
            id="user-email"
            type="email"
            required
            value={data.userEmail}
            onChange={handleChange('userEmail')}
            className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
            placeholder="jane@example.com"
          />
          <p className="mt-1 text-xs text-muted">
            An invitation email with a password setup link will be sent to this email
          </p>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? 'Creating Account...' : 'Create Account'}
      </button>
    </form>
  );
};

export default CombinedRegistrationForm;

