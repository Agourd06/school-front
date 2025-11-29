import React from 'react';
import CustomSelect from './CustomSelect';
import type { SelectOption } from './CustomSelect';

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  placeholder?: string;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  name?: string;
  value?: string | number;
}

/**
 * A fully customizable Select component with complete styling control.
 * Uses a custom dropdown to avoid browser default styling limitations.
 * 
 * @example
 * ```tsx
 * <Select
 *   label="Status"
 *   name="status"
 *   value={form.status}
 *   onChange={handleChange}
 *   options={[
 *     { value: '', label: 'Select status' },
 *     { value: 1, label: 'Active' },
 *     { value: 0, label: 'Inactive' },
 *   ]}
 *   error={errors.status}
 *   helperText="Choose the status for this item"
 * />
 * ```
 */
const Select: React.FC<SelectProps> = ({
  label,
  error,
  helperText,
  options,
  placeholder,
  className = '',
  disabled,
  name,
  id,
  onChange,
  value,
}) => {
  return (
    <CustomSelect
      label={label}
      error={error}
      helperText={helperText}
      options={options}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      name={name}
      id={id}
      onChange={onChange}
      value={value}
    />
  );
};

export default Select;
export type { SelectOption };

