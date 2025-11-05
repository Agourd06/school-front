import React from 'react';
import Select from 'react-select';
import type { Props as SelectProps } from 'react-select';

interface SearchSelectOption {
  value: number | string;
  label: string;
  data?: any;
}

interface SearchSelectProps {
  label?: string;
  value: number | string | '';
  onChange: (value: number | '' | string) => void;
  options: SearchSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  className?: string;
  components?: SelectProps['components'];
  isLoading?: boolean;
  error?: string | null;
  onSearchChange?: (query: string) => void;
  noOptionsMessage?: string | ((query: string) => string);
}

const SearchSelect: React.FC<SearchSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Search... ',
  disabled,
  isClearable = true,
  className,
  components,
  isLoading,
  error,
  onSearchChange,
  noOptionsMessage,
}) => {
  const [query, setQuery] = React.useState('');

  const filteredOptions = React.useMemo(() => {
    if (onSearchChange) return options;
    const lower = query.trim().toLowerCase();
    if (!lower) return options;
    return options.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [options, query, onSearchChange]);

  const selectedOption = React.useMemo(
    () => options.find((opt) => String(opt.value) === String(value)) || null,
    [options, value]
  );

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-700">{label}</label>}
      <div className="mt-1">
        <Select
          isClearable={isClearable}
          isDisabled={disabled}
          isLoading={isLoading}
          options={filteredOptions}
          components={components}
          onInputChange={(val, meta) => {
            if (meta.action === 'input-change') {
              setQuery(val);
              onSearchChange?.(val);
            }
            return val;
          }}
          placeholder={placeholder}
          value={selectedOption ? { value: selectedOption.value, label: selectedOption.label } : null}
          onChange={(opt: any) => {
            if (!opt) {
              onChange('');
            } else {
              onChange(opt.value);
            }
          }}
          styles={{
            menu: (base) => ({ ...base, zIndex: 50 }),
          }}
          noOptionsMessage={() => {
            if (typeof noOptionsMessage === 'function') return noOptionsMessage(query);
            if (typeof noOptionsMessage === 'string') return noOptionsMessage;
            return query ? 'No results found' : 'Type to search';
          }}
        />
        {error && <div className="mt-1 text-sm text-red-600">{error}</div>}
      </div>
    </div>
  );
};

export type { SearchSelectOption };
export default SearchSelect;

