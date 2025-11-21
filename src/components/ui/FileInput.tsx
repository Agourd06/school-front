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
        <label htmlFor={fileInputId} className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      {preview && previewUrl && (
        <div className={`mb-2 ${previewClassName}`}>
          <img
            src={previewUrl}
            alt="Preview"
            className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-md ring-2 ring-blue-100"
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
        className={`mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 ${
          error ? 'border-red-300' : ''
        } ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
};

export default FileInput;

