import React, { useState, useEffect, useMemo } from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';
import RichTextEditor from '../inputs/RichTextEditor';
import SearchSelect from '../inputs/SearchSelect';
import BaseModal from '../modals/BaseModal';
import { Eye } from 'lucide-react';
import { formatStudentDataForAttestation, type SimplifiedClass } from '../../utils/formatStudentDataForAttestation';
import { useStudentWithClass } from '../../hooks/useStudents';
import type { Student } from '../../api/students';

export interface StudentAttestationFormData {
  Idstudent: number | string | '';
  Idattestation: number | string | '';
  dateask: string;
  datedelivery?: string;
  description?: string;
  Status: number;
}

export interface StudentAttestation {
  id: number;
  Idstudent?: number;
  student?: { id: number };
  Idattestation?: number;
  attestation?: { id: number };
  dateask?: string;
  datedelivery?: string | null;
  description?: string | null;
  Status: number;
}

interface StudentAttestationFormProps {
  initialData?: StudentAttestation | null;
  onSubmit: (data: StudentAttestationFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  students: Array<{ id: number; first_name?: string; last_name?: string; email?: string; birthday?: string }>;
  attestations: Array<{ id: number; title: string; description?: string | null }>;
}

const StudentAttestationForm: React.FC<StudentAttestationFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  students,
  attestations,
}) => {
  const [form, setForm] = useState<StudentAttestationFormData>({
    Idstudent: '',
    Idattestation: '',
    dateask: '',
    datedelivery: '',
    description: '',
    Status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [attestationDetailsOpen, setAttestationDetailsOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        Idstudent: initialData.Idstudent ?? initialData.student?.id ?? '',
        Idattestation: initialData.Idattestation ?? initialData.attestation?.id ?? '',
        dateask: initialData.dateask || '',
        datedelivery: initialData.datedelivery || '',
        description: initialData.description || '',
        Status: typeof initialData.Status === 'number' ? initialData.Status : 1,
      });
    } else {
      setForm({
        Idstudent: '',
        Idattestation: '',
        dateask: '',
        datedelivery: '',
        description: '',
        Status: 1,
      });
    }
    setErrors({});
  }, [initialData]);

  const selectedAttestation = useMemo(
    () => (form.Idattestation ? attestations.find((a) => a.id === Number(form.Idattestation)) : undefined),
    [attestations, form.Idattestation]
  );

  const selectedStudent = useMemo(
    () => (form.Idstudent ? students.find((s) => s.id === Number(form.Idstudent)) : undefined),
    [students, form.Idstudent]
  );

  // Fetch student with class data (includes specialization, level, schoolYear) - optimized endpoint
  const { data: studentWithClassData } = useStudentWithClass(
    typeof form.Idstudent === 'number' ? form.Idstudent : 0
  );

  // Extract student and class from the response
  const studentFromApi = studentWithClassData?.student;
  const studentClass: SimplifiedClass | null | undefined = studentWithClassData?.class || undefined;

  // Combine student data with attestation description when both are selected
  useEffect(() => {
    // Use student data from API if available (has class info), otherwise use selected student from list
    const studentToUse = studentFromApi || selectedStudent;
    
    if (selectedAttestation?.description && studentToUse) {
      // Create student object with all required fields
      const studentData: Student = {
        id: studentToUse.id,
        first_name: studentToUse.first_name || '',
        last_name: studentToUse.last_name || '',
        email: studentToUse.email || '',
        birthday: studentToUse.birthday,
        created_at: '',
        updated_at: '',
      };

      // Format student data first (this goes at the top)
      const studentDataLines = formatStudentDataForAttestation({
        student: studentData,
        class: studentClass,
      });

      // Get the attestation description (this goes after student data)
      const attestationDescription = selectedAttestation.description || '';
      
      // Combine: Student data FIRST, then attestation description
      const combinedDescription = studentDataLines + 
        (attestationDescription.trim() ? '\n\n' + attestationDescription : '');

      setForm((prev) => ({
        ...prev,
        description: combinedDescription,
      }));
    } else if (selectedAttestation?.description && !studentToUse) {
      // If only attestation is selected, use description as-is
      setForm((prev) => ({
        ...prev,
        description: selectedAttestation.description || '',
      }));
    } else if (!selectedAttestation && studentToUse) {
      // If only student is selected, show just student data
      const studentData: Student = {
        id: studentToUse.id,
        first_name: studentToUse.first_name || '',
        last_name: studentToUse.last_name || '',
        email: studentToUse.email || '',
        birthday: studentToUse.birthday,
        created_at: '',
        updated_at: '',
      };
      const studentDataLines = formatStudentDataForAttestation({
        student: studentData,
        class: studentClass,
      });
      setForm((prev) => ({
        ...prev,
        description: studentDataLines,
      }));
    }
  }, [selectedAttestation, selectedStudent, studentFromApi, studentClass]);

  const updateField = (name: string, value: string | number | '') => {
    const newValue =
      name === 'Status' || name === 'Idstudent' || name === 'Idattestation'
        ? value !== '' && value !== null
          ? Number(value)
          : ''
        : value;

    setForm((prev) => {
      return { ...prev, [name]: newValue };
    });

    if (errors[name] && name !== 'datedelivery') {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    updateField(name, value);
  };

  const handleSearchSelectChange = (name: 'Idstudent' | 'Idattestation', value: number | string | '') => {
    updateField(name, value);
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (!form.Idstudent) next.Idstudent = 'Student is required';
    if (!form.Idattestation) next.Idattestation = 'Attestation is required';

    if (form.dateask && form.datedelivery) {
      const askDate = new Date(form.dateask);
      const deliveryDate = new Date(form.datedelivery);

      if (askDate >= deliveryDate) {
        next.datedelivery = 'Date Delivery must be after Date Asked';
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(serverError || errors.form) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError || errors.form}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-heading mb-1">Student *</label>
          {initialData ? (
            // Show read-only student info when editing
            <div className="rounded-md border border-border bg-surface px-3 py-2 text-sm text-body">
              {selectedStudent ? (
                <div className="space-y-1">
                  <p className="font-medium">
                    {`${selectedStudent.first_name ?? ''} ${selectedStudent.last_name ?? ''}`.trim() || 
                     selectedStudent.email || 
                     `Student #${selectedStudent.id}`}
                  </p>
                  {selectedStudent.email && (
                    <p className="text-xs text-muted">{selectedStudent.email}</p>
                  )}
                  {selectedStudent.birthday && (
                    <p className="text-xs text-muted">
                      Born: {new Date(selectedStudent.birthday).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-muted italic">Student information not available</p>
              )}
            </div>
          ) : (
            // Show SearchSelect when creating
            <SearchSelect
              value={form.Idstudent}
              onChange={(value) => handleSearchSelectChange('Idstudent', value)}
              options={[
                { value: '', label: 'Select a student' },
                ...students.map((s) => ({
                  value: s.id,
                  label: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || `Student #${s.id}`,
                })),
              ]}
              error={errors.Idstudent}
              placeholder="Search student..."
            />
          )}
        </div>
        <div>
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-heading">Attestation *</label>
            {form.Idattestation && (
              <button
                type="button"
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                onClick={() => setAttestationDetailsOpen(true)}
              >
                <Eye className="h-4 w-4" />
                View details
              </button>
            )}
          </div>
          <SearchSelect
            value={form.Idattestation}
            onChange={(value) => handleSearchSelectChange('Idattestation', value)}
            options={[
              { value: '', label: 'Select an attestation' },
              ...attestations.map((a) => ({
                value: a.id,
                label: a.title,
              })),
            ]}
            error={errors.Idattestation}
            placeholder="Search attestation..."
          />
        </div>
      </div>

      <Input
        label="Date Asked"
        type="date"
        name="dateask"
        value={form.dateask}
        onChange={handleChange}
      />

      {Boolean(initialData) && (
        <Input
          label="Date Delivery (optional)"
          type="date"
          name="datedelivery"
          value={form.datedelivery ?? ''}
          onChange={handleChange}
          min={form.dateask || undefined}
          error={errors.datedelivery}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-heading mb-1">Description</label>
        <div className="pointer-events-none opacity-80">
          <RichTextEditor
            value={form.description ?? ''}
            onChange={() => {}}
            placeholder="Description will be filled automatically from the attestation."
          />
        </div>
        <p className="mt-1 text-xs text-muted">This description mirrors the selected attestation template.</p>
      </div>
      <Select
        label="Status"
        name="Status"
        value={form.Status}
        onChange={handleChange}
        options={STATUS_OPTIONS_FORM.map((opt) => ({
          value: opt.value,
          label: opt.label,
        }))}
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
      <BaseModal
        isOpen={attestationDetailsOpen}
        onClose={() => setAttestationDetailsOpen(false)}
        title="Attestation details"
      >
        <div className="space-y-3 text-sm text-body">
          <p className="font-semibold">{selectedAttestation?.title ?? 'No attestation selected'}</p>
          <div
            className="rounded-lg border border-border bg-surface p-3"
            dangerouslySetInnerHTML={{
              __html:
                selectedAttestation?.description && selectedAttestation.description.trim().length > 0
                  ? selectedAttestation.description
                  : '<p class="text-muted italic">No description available.</p>',
            }}
          />
        </div>
      </BaseModal>
    </form>
  );
};

export default StudentAttestationForm;

