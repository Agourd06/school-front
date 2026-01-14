import React from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Textarea: React.FC<TextareaProps> = ({
  label,
  error,
  helperText,
  className = '',
  disabled,
  ...props
}) => {
  const textareaId = React.useId();

  return (
    <div>
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-heading">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        disabled={disabled}
        rows={4}
        className={`mt-1.5 block w-full rounded-lg border bg-white px-4 py-2.5 text-sm text-body placeholder:text-muted/70 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 ${
          error
            ? 'border-danger text-danger placeholder:text-danger/70 focus:ring-danger/20 focus:border-danger'
            : 'border-gray-300 hover:border-gray-400'
        } ${disabled ? 'cursor-not-allowed bg-gray-50 text-muted opacity-60' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
    </div>
  );
};

export default Textarea;

