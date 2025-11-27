import React, { useState, useEffect } from 'react';

export interface FileInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange'> {
  label?: string;
  error?: string;
  helperText?: string;
  accept?: string;
  onChange?: (file: File | null) => void;
  currentFileUrl?: string | null;
  preview?: boolean;
  previewClassName?: string;
}

const FileInput: React.FC<FileInputProps> = ({
  label,
  error,
  helperText,
  accept = 'image/*',
  onChange,
  currentFileUrl,
  preview = false,
  previewClassName = '',
  className = '',
  disabled,
  ...props
}) => {
  const fileInputId = React.useId();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (currentFileUrl) {
      setPreviewUrl(currentFileUrl);
    } else {
      setPreviewUrl(null);
    }
  }, [currentFileUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (file && preview) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else if (!file) {
      setPreviewUrl(currentFileUrl || null);
    }

    onChange?.(file);
  };

  return (
    <div>
      {label && (
        <label htmlFor={fileInputId} className="block text-sm font-medium text-heading">
          {label}
        </label>
      )}
      {preview && previewUrl && (
        <div className={`mb-2 ${previewClassName}`}>
          <img
            src={previewUrl}
            alt="Preview"
            className="h-24 w-24 rounded-full object-cover border-4 border-card shadow-md ring-2 ring-primary"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        </div>
      )}
      <input
        id={fileInputId}
        type="file"
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled}
        className={`mt-1 block w-full rounded-md border bg-card px-3 py-2 text-sm text-body shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary ${
          error ? 'border-danger focus:ring-danger focus:border-danger' : 'border-border'
        } ${disabled ? 'cursor-not-allowed bg-muted-foreground text-muted' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-danger">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-muted">{helperText}</p>}
    </div>
  );
};

export default FileInput;

