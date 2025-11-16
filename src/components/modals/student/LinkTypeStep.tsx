import React from 'react';
import { STATUS_OPTIONS_FORM } from '../../../constants/status';

interface LinkTypeStepProps {
  title: string;
  status: number;
  error: string;
  onTitleChange: (title: string) => void;
  onStatusChange: (status: number) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  isSubmitting: boolean;
  hasLinkType: boolean;
}

const LinkTypeStep: React.FC<LinkTypeStepProps> = ({
  title,
  status,
  error,
  onTitleChange,
  onStatusChange,
  onSubmit,
  onBack,
  isSubmitting,
  hasLinkType,
}) => {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select
            value={status}
            onChange={(e) => onStatusChange(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            {STATUS_OPTIONS_FORM.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
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
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Saving...' : hasLinkType ? 'Update & Finish' : 'Save & Finish'}
        </button>
      </div>
    </form>
  );
};

export default LinkTypeStep;

