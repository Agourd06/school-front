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
    <form onSubmit={onSubmit} className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Create Admin Account</h2>
        <p className="text-gray-600">Set up your administrator account for {companyName}</p>
      </div>

      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          Username <span className="text-red-500">*</span>
        </label>
        <input
          id="username"
          type="text"
          required
          value={data.username}
          onChange={handleChange('username')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          placeholder="jane.doe"
        />
      </div>

      <div>
        <label htmlFor="user-email" className="block text-sm font-medium text-gray-700 mb-2">
          Email Address <span className="text-red-500">*</span>
        </label>
        <input
          id="user-email"
          type="email"
          required
          value={data.email}
          onChange={handleChange('email')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
          placeholder="jane@example.com"
        />
        <p className="mt-1 text-xs text-gray-500">
          A password will be automatically generated and sent to this email
        </p>
      </div>

      <div>
        <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          required
          value={data.role}
          onChange={handleChange('role')}
          className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
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
          className="flex-1 border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          Back
        </button>
        <button
          type="submit"
          disabled={loading}
          className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {loading ? 'Creating...' : 'Complete Registration'}
        </button>
      </div>
    </form>
  );
};

export default UserForm;

