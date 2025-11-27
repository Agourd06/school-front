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
        className={`mt-1 block w-full rounded-md border bg-card px-3 py-2 text-sm text-body placeholder:text-muted shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-border'
        } ${disabled ? 'cursor-not-allowed bg-muted-foreground text-muted' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
    </div>
  );
};

export default Input;

