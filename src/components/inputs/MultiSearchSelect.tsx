import React from 'react';
import Select from 'react-select';
import type { Props as SelectProps } from 'react-select';

interface MultiSearchSelectOption {
  value: number | string;
  label: string;
  data?: unknown;
}

interface MultiSearchSelectProps {
  label?: string;
  value: (number | string)[];
  onChange: (value: (number | string)[]) => void;
  options: MultiSearchSelectOption[];
  placeholder?: string;
  disabled?: boolean;
  isClearable?: boolean;
  className?: string;
  isLoading?: boolean;
  error?: string | null;
  onSearchChange?: (query: string) => void;
  noOptionsMessage?: string | ((query: string) => string);
  showAllOption?: boolean;
  allOptionLabel?: string;
}

const MultiSearchSelect: React.FC<MultiSearchSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Search...',
  disabled,
  isClearable = true,
  className,
  isLoading,
  error,
  onSearchChange,
  noOptionsMessage,
  showAllOption = false,
  allOptionLabel = 'All classes',
}) => {
  const [query, setQuery] = React.useState('');

  const allOptionValue = '__ALL__';

  const enhancedOptions = React.useMemo(() => {
    if (showAllOption && options.length > 0) {
      return [
        { value: allOptionValue, label: allOptionLabel },
        ...options,
      ];
    }
    return options;
  }, [options, showAllOption, allOptionLabel, allOptionValue]);

  const filteredOptions = React.useMemo(() => {
    if (onSearchChange) return enhancedOptions;
    const lower = query.trim().toLowerCase();
    if (!lower) return enhancedOptions;
    return enhancedOptions.filter((opt) => opt.label.toLowerCase().includes(lower));
  }, [enhancedOptions, query, onSearchChange]);

  const selectedOptions = React.useMemo(
    () =>
      enhancedOptions.filter((opt) => {
        if (opt.value === allOptionValue) {
          // Show "All classes" as selected if all options are selected
          return value.length === options.length && options.length > 0;
        }
        return value.includes(opt.value);
      }),
    [enhancedOptions, value, options, allOptionValue]
  );

  // Theme-aware styles for react-select
  const customStyles = React.useMemo(() => {
    const getCSSVariable = (varName: string) => {
      return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    };

    const primary = getCSSVariable('--color-primary') || '#2563eb';
    const primaryForeground = getCSSVariable('--color-primary-foreground') || '#ffffff';
    const card = getCSSVariable('--color-card') || '#ffffff';
    const body = getCSSVariable('--color-body') || '#1f2937';
    const border = getCSSVariable('--color-border') || '#e2e8f0';
    const muted = getCSSVariable('--color-muted') || '#64748b';
    
    const primaryLight = `rgba(${parseInt(primary.slice(1, 3), 16)}, ${parseInt(primary.slice(3, 5), 16)}, ${parseInt(primary.slice(5, 7), 16)}, 0.1)`;

    return {
      control: (base: any, state: any) => ({
        ...base,
        backgroundColor: card,
        borderColor: error ? getCSSVariable('--color-danger') || '#ef4444' : state.isFocused ? primary : border,
        boxShadow: state.isFocused 
          ? `0 0 0 2px ${primaryLight}` 
          : error 
            ? `0 0 0 1px ${getCSSVariable('--color-danger') || '#ef4444'}` 
            : 'none',
        '&:hover': {
          borderColor: error ? getCSSVariable('--color-danger') || '#ef4444' : primary,
        },
        minHeight: '38px',
      }),
      menu: (base: any) => ({
        ...base,
        zIndex: 50,
        backgroundColor: card,
        border: `1px solid ${border}`,
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }),
      option: (base: any, state: any) => ({
        ...base,
        backgroundColor: state.isSelected
          ? primary
          : state.isFocused
            ? primaryLight
            : card,
        color: state.isSelected
          ? primaryForeground
          : state.isFocused
            ? primary
            : body,
        cursor: 'pointer',
        '&:active': {
          backgroundColor: primary,
          color: primaryForeground,
        },
      }),
      placeholder: (base: any) => ({
        ...base,
        color: muted,
      }),
      multiValue: (base: any) => ({
        ...base,
        backgroundColor: primaryLight,
      }),
      multiValueLabel: (base: any) => ({
        ...base,
        color: body,
      }),
      multiValueRemove: (base: any) => ({
        ...base,
        color: body,
        '&:hover': {
          backgroundColor: primary,
          color: primaryForeground,
        },
      }),
      input: (base: any) => ({
        ...base,
        color: body,
      }),
      indicatorSeparator: (base: any) => ({
        ...base,
        backgroundColor: border,
      }),
      dropdownIndicator: (base: any) => ({
        ...base,
        color: muted,
        '&:hover': {
          color: primary,
        },
      }),
      clearIndicator: (base: any) => ({
        ...base,
        color: muted,
        '&:hover': {
          color: primary,
        },
      }),
      loadingIndicator: (base: any) => ({
        ...base,
        color: primary,
      }),
      loadingMessage: (base: any) => ({
        ...base,
        color: body,
      }),
      noOptionsMessage: (base: any) => ({
        ...base,
        color: muted,
      }),
    };
  }, [error]);

  const handleChange = (selected: any) => {
    if (!selected || selected.length === 0) {
      onChange([]);
      return;
    }

    const selectedOptions = selected as MultiSearchSelectOption[];
    const selectedValues = selectedOptions.map((opt) => opt.value);
    
    // Check if "All classes" was selected
    const allOptionSelected = selectedOptions.some((opt) => opt.value === allOptionValue);
    
    if (allOptionSelected) {
      // If "All classes" is selected, select all actual class options (excluding the "All" option itself)
      const allClassValues = options.map((opt) => opt.value);
      onChange(allClassValues);
    } else {
      // Remove "All classes" value if it exists in the selection
      onChange(selectedValues.filter((v: any) => v !== allOptionValue));
    }
  };

  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-body">{label}</label>}
      <div className="mt-1">
        <Select
          isMulti
          isClearable={isClearable}
          isDisabled={disabled}
          isLoading={isLoading}
          options={filteredOptions}
          onInputChange={(val, meta) => {
            if (meta.action === 'input-change') {
              setQuery(val);
              onSearchChange?.(val);
            }
            return val;
          }}
          placeholder={placeholder}
          value={selectedOptions}
          onChange={handleChange}
          styles={customStyles}
          noOptionsMessage={() => {
            if (typeof noOptionsMessage === 'function') return noOptionsMessage(query);
            if (typeof noOptionsMessage === 'string') return noOptionsMessage;
            return query ? 'No results found' : 'Type to search';
          }}
        />
        {error && <div className="mt-1 text-sm text-danger">{error}</div>}
      </div>
    </div>
  );
};

export type { MultiSearchSelectOption };
export default MultiSearchSelect;
