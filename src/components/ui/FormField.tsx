import React from 'react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  helperText,
  required,
  children,
  className = '',
}) => {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-heading">
          {label}
          {required && <span className="ml-1 text-danger">*</span>}
        </label>
      )}
      <div className={label ? 'mt-1' : ''}>{children}</div>
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
    </div>
  );
};

export default FormField;

