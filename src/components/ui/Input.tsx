import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  className = '',
  disabled,
  ...props
}) => {
  const inputId = React.useId();

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-heading">
          {label}
        </label>
      )}
      <input
        id={inputId}
        disabled={disabled}
        className={`mt-1.5 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-body placeholder:text-muted/70 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 ${
          error ? 'border-danger focus:ring-danger/20 focus:border-danger' : 'border-primary'
        } ${disabled ? 'cursor-not-allowed bg-gray-50 text-muted opacity-60' : 'hover:border-primary'} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
    </div>
  );
};

export default Input;

