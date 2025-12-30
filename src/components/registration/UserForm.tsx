import React from 'react';

export interface UserFormData {
  username: string;
  email: string;
  role: 'user' | 'admin';
}

interface UserFormProps {
  data: UserFormData;
  companyName: string;
  onChange: (data: UserFormData) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  loading: boolean;
}

const UserForm: React.FC<UserFormProps> = ({ data, companyName, onChange, onSubmit, onBack, loading }) => {
  const handleChange = (field: keyof UserFormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const value = field === 'role' ? e.target.value as 'user' | 'admin' : e.target.value;
    onChange({ ...data, [field]: value });
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6 text-body">
      <div>
        <h2 className="text-2xl font-bold text-heading mb-2">Create Admin Account</h2>
        <p className="text-muted">Set up your administrator account for {companyName}</p>
      </div>

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
          value={data.email}
          onChange={handleChange('email')}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
          placeholder="jane@example.com"
        />
        <p className="mt-1 text-xs text-muted">
          An invitation email with a password setup link will be sent to this email
        </p>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-heading mb-2">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          required
          value={data.role}
          onChange={handleChange('role')}
          className="w-full rounded-lg border border-border px-4 py-3 text-sm focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none transition bg-card"
        >
          <option value="user">User</option>
          <option value="admin">Administrator</option>
        </select>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="flex-1 border border-border text-body py-3 px-4 rounded-lg font-semibold bg-card hover:bg-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-border focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-primary text-primary-foreground py-3 px-4 rounded-lg font-semibold hover:brightness-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Creating...' : 'Complete Registration'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;

