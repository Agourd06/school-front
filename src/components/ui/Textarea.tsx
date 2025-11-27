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
        className={`mt-1 block w-full rounded-md border bg-card px-3 py-2 text-sm text-body shadow-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary ${
          error
            ? 'border-danger text-danger placeholder:text-danger focus:ring-danger focus:border-danger'
            : 'border-border'
        } ${disabled ? 'cursor-not-allowed bg-muted-foreground text-muted' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
    </div>
  );
};

export default Textarea;

