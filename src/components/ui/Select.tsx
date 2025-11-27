import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
}

const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  className = '',
  disabled,
  ...props
}) => {
  const selectId = React.useId();

  return (
    <div>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-heading">
          {label}
        </label>
      )}
      <select
        id={selectId}
        disabled={disabled}
        className={`mt-1 block w-full rounded-md border bg-card px-3 py-2 text-sm text-body shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-border'
        } ${disabled ? 'cursor-not-allowed bg-muted-foreground text-muted' : ''} ${className}`}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
    </div>
  );
};

export default Select;

