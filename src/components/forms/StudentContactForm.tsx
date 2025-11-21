import React, { useState, useEffect } from 'react';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, Button } from '../ui';

export interface StudentContactFormData {
  firstname: string;
  lastname: string;
  birthday: string;
  email: string;
  phone: string;
  adress: string;
  city: string;
  country: string;
  student_id: number | string | '';
  studentlinktypeId: number | string | '';
  status: number;
}

export interface StudentContact {
  id: number;
  firstname: string;
  lastname: string;
  birthday?: string;
  email?: string;
  phone?: string;
  adress?: string;
  city?: string;
  country?: string;
  student_id?: number;
  studentlinktypeId?: number;
  status: number;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface StudentContactFormProps {
  initialData?: StudentContact | null;
  onSubmit: (data: StudentContactFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  studentOptions: SearchSelectOption[];
  linkTypes: Array<{ id: number; title: string }>;
}

const StudentContactForm: React.FC<StudentContactFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  studentOptions,
  linkTypes,
}) => {
  const [form, setForm] = useState<StudentContactFormData>({
    firstname: '',
    lastname: '',
    birthday: '',
    email: '',
    phone: '',
    adress: '',
    city: '',
    country: '',
    student_id: '',
    studentlinktypeId: '',
    status: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setForm({
        firstname: initialData.firstname || '',
        lastname: initialData.lastname || '',
        birthday: initialData.birthday || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        adress: initialData.adress || '',
        city: initialData.city || '',
        country: initialData.country || '',
        student_id: initialData.student_id ?? '',
        studentlinktypeId: initialData.studentlinktypeId ?? '',
        status: typeof initialData.status === 'number' ? initialData.status : 1,
      });
    } else {
      setForm({
        firstname: '',
        lastname: '',
        birthday: '',
        email: '',
        phone: '',
        adress: '',
        city: '',
        country: '',
        student_id: '',
        studentlinktypeId: '',
        status: 1,
      });
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.firstname.trim()) e.firstname = 'First name is required';
    if (!form.lastname.trim()) e.lastname = 'Last name is required';
    if (!isEditing && !form.student_id) e.student_id = 'Student is required';
    if (form.email && !emailRegex.test(form.email)) e.email = 'Invalid email';
    return e;
  };

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = ev.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'studentlinktypeId' || name === 'student_id'
          ? value
            ? name === 'student_id'
              ? Number(value)
              : String(value)
            : ''
          : name === 'status'
          ? Number(value)
          : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleStudentChange = (value: number | string | '') => {
    setForm((prev) => ({
      ...prev,
      student_id: value === '' ? '' : Number(value),
    }));
    if (errors.student_id) setErrors((prev) => ({ ...prev, student_id: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      setErrors(eMap);
      return;
    }
    try {
      await onSubmit(form);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const msg = axiosError?.response?.data?.message || 'Failed to save';
      setErrors((prev) => ({ ...prev, form: msg }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(serverError || errors.form) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError || errors.form}
        </div>
      )}

      <div>
        <SearchSelect
          label={isEditing ? 'Student' : 'Student *'}
          value={form.student_id}
          onChange={handleStudentChange}
          options={studentOptions}
          placeholder="Select a student"
          isClearable={isEditing}
          disabled={isEditing}
        />
        {errors.student_id && <p className="mt-1 text-sm text-red-600">{errors.student_id}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="First name"
          name="firstname"
          value={form.firstname}
          onChange={handleChange}
          error={errors.firstname}
        />
        <Input
          label="Last name"
          name="lastname"
          value={form.lastname}
          onChange={handleChange}
          error={errors.lastname}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Birthday"
          type="date"
          name="birthday"
          value={form.birthday}
          onChange={handleChange}
        />
        <Input
          label="Email"
          name="email"
          value={form.email}
          onChange={handleChange}
          error={errors.email}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Phone"
          name="phone"
          value={form.phone}
          onChange={handleChange}
        />
        <Select
          label="Link type"
          name="studentlinktypeId"
          value={form.studentlinktypeId}
          onChange={handleChange}
          options={[
            { value: '', label: 'None' },
            ...linkTypes.map((lt) => ({
              value: lt.id,
              label: lt.title,
            })),
          ]}
        />
        <Select
          label="Status"
          name="status"
          value={form.status}
          onChange={handleChange}
          options={STATUS_OPTIONS_FORM.map((opt) => ({
            value: opt.value,
            label: opt.label,
          }))}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Adress"
          name="adress"
          value={form.adress}
          onChange={handleChange}
        />
        <Input
          label="City"
          name="city"
          value={form.city}
          onChange={handleChange}
        />
        <Input
          label="Country"
          name="country"
          value={form.country}
          onChange={handleChange}
        />
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" isLoading={isSubmitting} disabled={isSubmitting}>
          {isEditing ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
};

export default StudentContactForm;

