import React, { useRef } from 'react';
import { validatePdfFile, PDF_MAX_SIZE_BYTES, formatFileSize } from '../../utils/pdfValidation';

export interface PdfFileInputProps {
  /**
   * Label for the input field
   */
  label?: string;
  
  /**
   * Current error message to display
   */
  error?: string;
  
  /**
   * Current PDF file (for controlled component)
   */
  value?: File | null;
  
  /**
   * Callback when file changes
   */
  onChange?: (file: File | null, error?: string) => void;
  
  /**
   * Existing PDF file path/URL (for display purposes)
   */
  existingPdfPath?: string | null;
  
  /**
   * Maximum file size in bytes (default: 10MB)
   */
  maxSizeBytes?: number;
  
  /**
   * Whether the input is disabled
   */
  disabled?: boolean;
  
  /**
   * Additional CSS classes
   */
  className?: string;
  
  /**
   * Input ID (auto-generated if not provided)
   */
  id?: string;
}

/**
 * Reusable PDF file input component with validation
 * 
 * @example
 * ```tsx
 * <PdfFileInput
 *   label="PDF Document"
 *   value={pdfFile}
 *   onChange={(file, error) => {
 *     setPdfFile(file);
 *     setError(error);
 *   }}
 *   existingPdfPath={existingPdf}
 *   error={errors.pdf_file}
 * />
 * ```
 */
const PdfFileInput: React.FC<PdfFileInputProps> = ({
  label = 'PDF Document',
  error,
  value,
  onChange,
  existingPdfPath,
  maxSizeBytes = PDF_MAX_SIZE_BYTES,
  disabled = false,
  className = '',
  id,
}) => {
  const inputId = id || React.useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    
    if (!file) {
      onChange?.(null);
      return;
    }

    // Validate the file
    const validation = validatePdfFile(file, maxSizeBytes);
    
    if (!validation.isValid) {
      onChange?.(null, validation.error);
      // Clear the input so user can try again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // File is valid
    onChange?.(file);
  };

  const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
  const hasExistingPdf = !!existingPdfPath;
  const hasSelectedFile = !!value;

  return (
    <div className={className}>
      <label htmlFor={inputId} className="block text-sm font-medium text-heading mb-2">
        {label}
        {hasExistingPdf && (
          <span className="text-xs text-muted ml-1">(Optional - upload new to replace)</span>
        )}
      </label>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="application/pdf"
        onChange={handleFileChange}
        disabled={disabled}
        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 file:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      />
      
      {/* Selected file info */}
      {hasSelectedFile && (
        <p className="mt-1 text-sm text-gray-600">
          Selected: {value.name} ({formatFileSize(value.size)})
        </p>
      )}
      
      {/* Existing PDF info */}
      {hasExistingPdf && !hasSelectedFile && (
        <p className="mt-1 text-xs text-gray-500">Current PDF: {existingPdfPath}</p>
      )}
      
      {/* Error message */}
      {error && (
        <p className="mt-1 text-sm text-danger">{error}</p>
      )}
      
      {/* Helper text */}
      {!error && (
        <p className="mt-1 text-xs text-gray-500">
          Max size: {maxSizeMB}MB, PDF files only
        </p>
      )}
    </div>
  );
};

export default PdfFileInput;

