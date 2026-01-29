import React from 'react';
import Select from 'react-select';
import type { Props as SelectProps } from 'react-select';

interface SearchSelectOption {
  value: number | string;
  label: string;
  data?: unknown;
  lifecycleStatus?: 'planned' | 'ongoing' | 'completed';
  color?: string;
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
    
    // Create transparent primary color for hover
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
        zIndex: 9999,
        backgroundColor: card,
        border: `1px solid ${border}`,
        borderRadius: '0.375rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      }),
      menuPortal: (base: any) => ({
        ...base,
        zIndex: 9999,
      }),
      option: (base: any, state: any) => {
        const option = state.data as SearchSelectOption;
        let borderLeftColor = 'transparent';
        if (option?.lifecycleStatus === 'ongoing') borderLeftColor = '#10b981'; // green
        else if (option?.lifecycleStatus === 'completed') borderLeftColor = '#6b7280'; // grey
        else if (option?.lifecycleStatus === 'planned') borderLeftColor = '#3b82f6'; // blue
        
        return {
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
          borderLeft: borderLeftColor !== 'transparent' ? `3px solid ${borderLeftColor}` : 'none',
          paddingLeft: borderLeftColor !== 'transparent' ? 'calc(0.75rem - 3px)' : base.paddingLeft,
          '&:active': {
            backgroundColor: primary,
            color: primaryForeground,
          },
        };
      },
      placeholder: (base: any) => ({
        ...base,
        color: muted,
      }),
      singleValue: (base: any) => ({
        ...base,
        color: body,
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
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

  const labelId = React.useMemo(() => `search-select-label-${Math.random().toString(36).substr(2, 9)}`, []);

  return (
    <div className={className}>
      {label && <label id={labelId} className="block text-sm font-medium text-body">{label}</label>}
      <div className="mt-1">
        <Select
          aria-labelledby={label ? labelId : undefined}
          aria-label={!label ? placeholder : undefined}
          isClearable={isClearable}
          isDisabled={disabled}
          isLoading={isLoading}
          options={filteredOptions}
          components={components}
          menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
          menuPosition="fixed"
          onInputChange={(val, meta) => {
            if (meta.action === 'input-change') {
              setQuery(val);
              onSearchChange?.(val);
            }
            return val;
          }}
          placeholder={placeholder}
          value={selectedOption ? { 
            value: selectedOption.value, 
            label: selectedOption.label,
            lifecycleStatus: selectedOption.lifecycleStatus,
            color: selectedOption.color
          } : null}
          onChange={(opt) => {
            const selected = opt as SearchSelectOption | null;
            if (!selected) {
              onChange('');
            } else {
              onChange(selected.value);
            }
          }}
          styles={customStyles}
          formatOptionLabel={(option: any) => {
            const { label, lifecycleStatus, color } = option;
            if (lifecycleStatus || color) {
              let bgColor = '';
              if (lifecycleStatus === 'ongoing') bgColor = '#10b981'; // green
              else if (lifecycleStatus === 'completed') bgColor = '#6b7280'; // grey
              else if (lifecycleStatus === 'planned') bgColor = '#3b82f6'; // blue
              else if (color) bgColor = color;
              
              return (
                <div className="flex items-center gap-2">
                  {bgColor && (
                    <span
                      className="inline-block w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: bgColor }}
                    />
                  )}
                  <span>{label}</span>
                </div>
              );
            }
            return label;
          }}
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

export type { SearchSelectOption };
export default SearchSelect;

