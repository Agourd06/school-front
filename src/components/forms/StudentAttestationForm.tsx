import React, { useState, useEffect } from 'react';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';

export interface StudentAttestationFormData {
  Idstudent: number | string | '';
  Idattestation: number | string | '';
  dateask: string;
  datedelivery: string;
  Status: number;
}

export interface StudentAttestation {
  id: number;
  Idstudent?: number;
  student?: { id: number };
  Idattestation?: number;
  attestation?: { id: number };
  dateask?: string;
  datedelivery?: string;
  Status: number;
}

interface StudentAttestationFormProps {
  initialData?: StudentAttestation | null;
  onSubmit: (data: StudentAttestationFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  students: Array<{ id: number; first_name?: string; last_name?: string; email?: string }>;
  attestations: Array<{ id: number; title: string }>;
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
    Status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialData) {
      setForm({
        Idstudent: initialData.Idstudent ?? initialData.student?.id ?? '',
        Idattestation: initialData.Idattestation ?? initialData.attestation?.id ?? '',
        dateask: initialData.dateask || '',
        datedelivery: initialData.datedelivery || '',
        Status: typeof initialData.Status === 'number' ? initialData.Status : 1,
      });
    } else {
      setForm({
        Idstudent: '',
        Idattestation: '',
        dateask: '',
        datedelivery: '',
        Status: 1,
      });
    }
    setErrors({});
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    const newValue = name === 'Status' || name === 'Idstudent' || name === 'Idattestation'
      ? (value ? Number(value) : '')
      : value;

    setForm((prev) => {
      const updatedForm = { ...prev, [name]: newValue };

      if (name === 'dateask' || name === 'datedelivery') {
        const dateask = name === 'dateask' ? value : updatedForm.dateask;
        const datedelivery = name === 'datedelivery' ? value : updatedForm.datedelivery;

        if (dateask && datedelivery) {
          const askDate = new Date(dateask);
          const deliveryDate = new Date(datedelivery);

          if (askDate >= deliveryDate) {
            setErrors((prevErrors) => ({
              ...prevErrors,
              datedelivery: 'Date Delivery must be after Date Asked',
            }));
          } else {
            setErrors((prevErrors) => {
              const next = { ...prevErrors };
              delete next.datedelivery;
              return next;
            });
          }
        } else {
          setErrors((prevErrors) => {
            const next = { ...prevErrors };
            delete next.datedelivery;
            return next;
          });
        }
      }

      return updatedForm;
    });

    if (errors[name] && name !== 'datedelivery') {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
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

      <Select
        label="Student *"
        name="Idstudent"
        value={form.Idstudent}
        onChange={handleChange}
        options={[
          { value: '', label: 'Select a student' },
          ...students.map((s) => ({
            value: s.id,
            label: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || `Student #${s.id}`,
          })),
        ]}
        error={errors.Idstudent}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <Select
        label="Attestation *"
        name="Idattestation"
        value={form.Idattestation}
        onChange={handleChange}
        options={[
          { value: '', label: 'Select an attestation' },
          ...attestations.map((a) => ({
            value: a.id,
            label: a.title,
          })),
        ]}
        error={errors.Idattestation}
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Date Asked"
          type="date"
          name="dateask"
          value={form.dateask}
          onChange={handleChange}
          max={form.datedelivery || undefined}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <Input
          label="Date Delivery"
          type="date"
          name="datedelivery"
          value={form.datedelivery}
          onChange={handleChange}
          min={form.dateask || undefined}
          error={errors.datedelivery}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
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
        className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />

      <div className="flex justify-end space-x-3 pt-4">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {initialData ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default StudentAttestationForm;

