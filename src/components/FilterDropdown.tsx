import React from 'react';

interface FilterOption {
  value: string | number | null;
  label: string;
}

interface FilterDropdownProps {
  options: FilterOption[];
  value: string | number | null;
  onChange: (value: string | number | null) => void;
  placeholder?: string;
  isLoading?: boolean;
  className?: string;
}

const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder = 'All',
  isLoading = false,
  className = ''
}) => {

  return (
    <div className={`relative ${className}`}>
      <select
        value={value || ''}
        onChange={(e) => {
          const newValue = e.target.value;
          onChange(newValue === '' ? null : newValue);
        }}
        disabled={isLoading}
        className="block w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value || 'null'} value={option.value || ''}>
            {option.label}
          </option>
        ))}
      </select>

      {/* Filter icon */}
      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
        <svg
          className="h-4 w-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
          />
        </svg>
      </div>
    </div>
  );
};

export default FilterDropdown;
