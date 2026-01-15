import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import BaseModal from './BaseModal';
import { Button } from '../ui';
import { Upload, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useCreateStudent } from '../../hooks/useStudents';

interface ExcelStudentRow {
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  birthday: string;
  gender: string;
}

interface ValidatedStudent extends ExcelStudentRow {
  isValid: boolean;
  errors: string[];
  rowIndex: number;
}

const REQUIRED_COLUMNS = ['email', 'phone', 'first_name', 'last_name', 'birthday', 'gender'];

const ExcelImportModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess?: () => void;
}> = ({ isOpen, onClose, onImportSuccess }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [validatedStudents, setValidatedStudents] = useState<ValidatedStudent[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [fileError, setFileError] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{
    successCount: number;
    duplicateErrors: Array<{ rowIndex: number; email: string; name: string }>;
    otherErrors: string[];
  } | null>(null);
  const createStudentMut = useCreateStudent();

  const normalizeColumnName = (name: string): string => {
    return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  };

  const validateStudent = (row: Record<string, any>, rowIndex: number): ValidatedStudent => {
    const errors: string[] = [];
    const student: Partial<ExcelStudentRow> = {};

    // Map columns (case-insensitive)
    const columnMap: Record<string, string> = {};
    Object.keys(row).forEach((key) => {
      const normalized = normalizeColumnName(key);
      if (REQUIRED_COLUMNS.includes(normalized)) {
        columnMap[normalized] = key;
      }
    });

    // Validate each required field
    REQUIRED_COLUMNS.forEach((col) => {
      const originalKey = columnMap[col];
      const value = originalKey ? String(row[originalKey] || '').trim() : '';
      
      if (!value) {
        errors.push(`${col} is required`);
      } else {
        (student as any)[col] = value;
      }
    });

    return {
      ...(student as ExcelStudentRow),
      isValid: errors.length === 0,
      errors,
      rowIndex: rowIndex + 1, // 1-based for display
    };
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
      'application/vnd.ms-excel', // .xls
    ];
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!validTypes.includes(file.type) && !validExtensions.includes(fileExtension)) {
      setFileError('Please select a valid Excel file (.xlsx or .xls)');
      return;
    }

    setIsProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const data = XLSX.utils.sheet_to_json(worksheet, { raw: false });

      if (data.length === 0) {
        setFileError('The Excel file is empty or has no data rows.');
        setIsProcessing(false);
        return;
      }

      // Validate column headers
      const firstRow = data[0] as Record<string, any>;
      const availableColumns = Object.keys(firstRow).map(normalizeColumnName);
      const missingColumns = REQUIRED_COLUMNS.filter((col) => !availableColumns.includes(col));

      if (missingColumns.length > 0) {
        setFileError(
          `Missing required columns: ${missingColumns.join(', ')}. Please ensure your Excel file has these columns (case-insensitive).`
        );
        setIsProcessing(false);
        return;
      }

      // Validate each row
      const validated = data.map((row, index) => validateStudent(row as Record<string, any>, index));
      setValidatedStudents(validated);
      setFileError(null); // Clear any previous errors
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      setFileError('Error reading Excel file. Please make sure it is a valid Excel file.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleImport = async () => {
    const validStudents = validatedStudents.filter((s) => s.isValid);
    if (validStudents.length === 0) return;

    setImportProgress({ current: 0, total: validStudents.length });
    setIsProcessing(true);
    setImportResult(null); // Clear previous results

    const duplicateErrors: Array<{ rowIndex: number; email: string; name: string }> = [];
    const otherErrors: string[] = [];
    let successCount = 0;

    for (let i = 0; i < validStudents.length; i++) {
      const student = validStudents[i];
      try {
        const formData = new FormData();
        formData.append('email', student.email);
        formData.append('phone', student.phone);
        formData.append('first_name', student.first_name);
        formData.append('last_name', student.last_name);
        formData.append('birthday', student.birthday);
        formData.append('gender', student.gender);
        formData.append('status', '2'); // Set status to pending

        await createStudentMut.mutateAsync(formData);
        successCount++;
      } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Unknown error';
        const errorMessageLower = String(errorMessage).toLowerCase();
        
        // Check if this is a duplicate error
        if (
          errorMessageLower.includes('already exists') ||
          errorMessageLower.includes('duplicate entry') ||
          errorMessageLower.includes('duplicate')
        ) {
          duplicateErrors.push({
            rowIndex: student.rowIndex,
            email: student.email,
            name: `${student.first_name} ${student.last_name}`.trim() || student.email,
          });
        } else {
          otherErrors.push(`Row ${student.rowIndex} (${student.email}): ${errorMessage}`);
        }
      }

      setImportProgress({ current: i + 1, total: validStudents.length });
    }

    setIsProcessing(false);
    setImportResult({ successCount, duplicateErrors, otherErrors });

    if (successCount > 0 && onImportSuccess) {
      onImportSuccess();
    }
  };

  const handleClose = () => {
    setValidatedStudents([]);
    setImportProgress({ current: 0, total: 0 });
    setFileError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const hasInvalidStudents = validatedStudents.some((s) => !s.isValid);
  const allValid = validatedStudents.length > 0 && validatedStudents.every((s) => s.isValid);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={handleClose}
      title="Import Students from Excel"
      className="sm:max-w-6xl"
      contentClassName="p-6"
    >
      <div className="space-y-6">
        {/* File Error Display */}
        {fileError && (
          <div className="rounded-md border border-danger-light bg-danger-light px-4 py-3 text-sm text-danger-dark">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{fileError}</div>
              <button
                type="button"
                onClick={() => setFileError(null)}
                className="text-danger-dark hover:text-danger flex-shrink-0"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* File Upload Section */}
        {validatedStudents.length === 0 && (
          <div className="space-y-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 mb-2">
                Select an Excel file (.xlsx or .xls) containing student data
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Required columns: email, phone, first_name, last_name, birthday, gender
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                onChange={handleFileSelect}
                className="hidden"
                id="excel-file-input"
              />
              <label htmlFor="excel-file-input">
                <Button
                  type="button"
                  variant="primary"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="cursor-pointer"
                >
                  {isProcessing ? 'Processing...' : 'Select Excel File'}
                </Button>
              </label>
            </div>
          </div>
        )}

        {/* Preview Section */}
        {validatedStudents.length > 0 && (
          <div className="space-y-4">
            {/* Global Warning */}
            {hasInvalidStudents && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    Some students have missing required fields. Please fix the Excel file before importing.
                  </p>
                </div>
              </div>
            )}

            {/* Summary */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-gray-600">
                  Total students: <strong>{validatedStudents.length}</strong>
                </span>
                <span className="text-green-600">
                  Valid: <strong>{validatedStudents.filter((s) => s.isValid).length}</strong>
                </span>
                <span className="text-red-600">
                  Invalid: <strong>{validatedStudents.filter((s) => !s.isValid).length}</strong>
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setValidatedStudents([]);
                  setImportResult(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                Upload Different File
              </Button>
            </div>

            {/* Preview Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="overflow-x-auto max-h-[60vh]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Row
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Phone
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        First Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Last Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Birthday
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Gender
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {validatedStudents.map((student, index) => (
                      <tr
                        key={index}
                        className={student.isValid ? 'hover:bg-gray-50' : 'bg-red-50 hover:bg-red-100'}
                      >
                        <td className="px-4 py-3 text-sm text-gray-900">{student.rowIndex}</td>
                        <td
                          className={`px-4 py-3 text-sm ${
                            !student.email ? 'bg-red-200 text-red-900 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {student.email || '—'}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${
                            !student.phone ? 'bg-red-200 text-red-900 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {student.phone || '—'}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${
                            !student.first_name ? 'bg-red-200 text-red-900 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {student.first_name || '—'}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${
                            !student.last_name ? 'bg-red-200 text-red-900 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {student.last_name || '—'}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${
                            !student.birthday ? 'bg-red-200 text-red-900 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {student.birthday || '—'}
                        </td>
                        <td
                          className={`px-4 py-3 text-sm ${
                            !student.gender ? 'bg-red-200 text-red-900 font-medium' : 'text-gray-700'
                          }`}
                        >
                          {student.gender || '—'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {student.isValid ? (
                            <span className="inline-flex items-center gap-1 text-green-600">
                              <CheckCircle2 className="h-4 w-4" />
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-red-600" title={student.errors.join(', ')}>
                              <AlertCircle className="h-4 w-4" />
                              Missing required data
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Import Progress */}
            {isProcessing && importProgress.total > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-800">Importing students...</span>
                  <span className="text-sm text-blue-600">
                    {importProgress.current} / {importProgress.total}
                  </span>
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(importProgress.current / importProgress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}

            {/* Import Result */}
            {importResult && !isProcessing && (
              <div className="space-y-3">
                {importResult.successCount > 0 && (
                  <div className="rounded-md border border-success-light bg-success-light px-4 py-3 text-sm text-success-dark">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium">Successfully imported {importResult.successCount} student(s)!</p>
                      </div>
                    </div>
                  </div>
                )}

                {importResult.duplicateErrors.length > 0 && (
                  <div className="rounded-md border border-yellow-200 bg-yellow-50 px-4 py-3 text-sm">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-yellow-800 mb-2">
                          The following student(s) already exist and were skipped:
                        </p>
                        <ul className="list-disc list-inside space-y-1 text-yellow-700">
                          {importResult.duplicateErrors.map((err, idx) => (
                            <li key={idx}>
                              Row {err.rowIndex}: {err.name} ({err.email})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {importResult.otherErrors.length > 0 && (
                  <div className="rounded-md border border-danger-light bg-danger-light px-4 py-3 text-sm text-danger-dark">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium mb-2">Import completed with errors:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {importResult.otherErrors.slice(0, 5).map((err, idx) => (
                            <li key={idx}>{err}</li>
                          ))}
                          {importResult.otherErrors.length > 5 && (
                            <li>... and {importResult.otherErrors.length - 5} more error(s)</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {importResult.successCount === 0 && importResult.duplicateErrors.length === 0 && importResult.otherErrors.length === 0 && (
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    No students were imported.
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="secondary" onClick={handleClose} disabled={isProcessing}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="primary"
                onClick={handleImport}
                disabled={!allValid || isProcessing || validatedStudents.filter((s) => s.isValid).length === 0 || !!importResult}
                isLoading={isProcessing}
              >
                {isProcessing ? 'Importing...' : `Import ${validatedStudents.filter((s) => s.isValid).length} Student(s)`}
              </Button>
            </div>
          </div>
        )}
      </div>
    </BaseModal>
  );
};

export default ExcelImportModal;
