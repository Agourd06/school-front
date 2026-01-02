/**
 * PDF validation utilities
 * Reusable functions for validating PDF files
 */

export const PDF_MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const PDF_MIME_TYPE = 'application/pdf';

export interface PdfValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a PDF file
 * @param file - The file to validate
 * @param maxSizeBytes - Maximum file size in bytes (default: 10MB)
 * @returns Validation result with error message if invalid
 */
export const validatePdfFile = (
  file: File,
  maxSizeBytes: number = PDF_MAX_SIZE_BYTES
): PdfValidationResult => {
  // Validate file type
  if (file.type !== PDF_MIME_TYPE) {
    return {
      isValid: false,
      error: 'Only PDF files are allowed',
    };
  }

  // Validate file size
  if (file.size > maxSizeBytes) {
    const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(0);
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeMB}MB`,
    };
  }

  return { isValid: true };
};

/**
 * Format file size to human-readable string
 * @param bytes - File size in bytes
 * @returns Formatted string (e.g., "2.5 MB")
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

