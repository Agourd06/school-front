import React, { useState, useEffect } from 'react';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { getFileUrl } from '../../utils/apiConfig';
import { Input, Select, FileInput, Button } from '../ui';

export interface StudentDiplomeFormData {
  title: string;
  school: string;
  diplome: string;
  annee: string;
  country: string;
  city: string;
  student_id: number | string | '';
  status: number;
}

export interface StudentDiplome {
  id: number;
  title: string;
  school: string;
  diplome?: string;
  annee?: number | string;
  country?: string;
  city?: string;
  student_id?: number;
  status: number;
  diplome_picture_1?: string;
  diplome_picture_2?: string;
}

const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

interface StudentDiplomeFormProps {
  initialData?: StudentDiplome | null;
  onSubmit: (data: StudentDiplomeFormData, file1: File | null, file2: File | null) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  serverError?: string | null;
  studentOptions: SearchSelectOption[];
  studentsLoading?: boolean;
  studentsError?: Error | null;
  onStudentSearchChange?: (query: string) => void;
}

const StudentDiplomeForm: React.FC<StudentDiplomeFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  serverError,
  studentOptions,
  studentsLoading = false,
  studentsError = null,
  onStudentSearchChange,
}) => {
  const [form, setForm] = useState<StudentDiplomeFormData>({
    title: '',
    school: '',
    diplome: '',
    annee: '',
    country: '',
    city: '',
    student_id: '',
    status: 1,
  });
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!initialData;

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        school: initialData.school || '',
        diplome: initialData.diplome || '',
        annee: initialData.annee ? String(initialData.annee) : '',
        country: initialData.country || '',
        city: initialData.city || '',
        student_id: initialData.student_id ?? '',
        status: typeof initialData.status === 'number' ? initialData.status : 1,
      });
      setFile1(null);
      setFile2(null);
    } else {
      setForm({
        title: '',
        school: '',
        diplome: '',
        annee: '',
        country: '',
        city: '',
        student_id: '',
        status: 1,
      });
      setFile1(null);
      setFile2(null);
    }
    setErrors({});
  }, [initialData]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = 'Title is required';
    if (!form.school.trim()) e.school = 'School is required';
    if (!form.student_id) e.student_id = 'Student is required';
    if (form.annee && !/^\d{4}$/.test(String(form.annee))) e.annee = 'Year must be YYYY';
    const files: Array<[string, File | null]> = [
      ['diplome_picture_1', file1],
      ['diplome_picture_2', file2],
    ];
    for (const [name, f] of files) {
      if (!f) continue;
      if (f.size > MAX_FILE_BYTES) e[name] = 'Max size 2MB';
      if (!ALLOWED_TYPES.includes(f.type)) e[name] = 'Invalid type (jpeg, png, gif, webp)';
    }
    return e;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === 'student_id'
          ? value
            ? String(value)
            : ''
          : name === 'status'
          ? Number(value)
          : value,
    }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleFile1Change = (file: File | null) => {
    setFile1(file);
    if (errors.diplome_picture_1) setErrors((prev) => ({ ...prev, diplome_picture_1: '' }));
  };

  const handleFile2Change = (file: File | null) => {
    setFile2(file);
    if (errors.diplome_picture_2) setErrors((prev) => ({ ...prev, diplome_picture_2: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) {
      setErrors(eMap);
      return;
    }
    try {
      await onSubmit(form, file1, file2);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      setErrors((prev) => ({ ...prev, form: axiosError?.response?.data?.message || 'Failed to save' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {(serverError || errors.form) && (
        <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {serverError || errors.form}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Title"
          name="title"
          value={form.title}
          onChange={handleChange}
          error={errors.title}
        />
        <Input
          label="School"
          name="school"
          value={form.school}
          onChange={handleChange}
          error={errors.school}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Input
          label="Diplome"
          name="diplome"
          value={form.diplome}
          onChange={handleChange}
        />
        <Input
          label="Year (YYYY)"
          name="annee"
          value={form.annee}
          onChange={handleChange}
          error={errors.annee}
        />
        <div>
          <SearchSelect
            label="Student"
            value={form.student_id}
            onChange={(val) => setForm((prev) => ({ ...prev, student_id: val }))}
            placeholder="Search students..."
            options={studentOptions}
            isLoading={studentsLoading}
            error={studentsError ? 'Failed to load students' : null}
            onSearchChange={onStudentSearchChange}
            noOptionsMessage={(query) => (query ? 'No students found' : 'Type to search students')}
          />
          {errors.student_id && <p className="text-sm text-red-600">{errors.student_id}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input
          label="Country"
          name="country"
          value={form.country}
          onChange={handleChange}
        />
        <Input
          label="City"
          name="city"
          value={form.city}
          onChange={handleChange}
        />
      </div>

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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FileInput
          label="Diplome picture 1"
          accept="image/*"
          onChange={handleFile1Change}
          currentFileUrl={
            isEditing && initialData?.diplome_picture_1 && !file1
              ? getFileUrl(initialData.diplome_picture_1)
              : null
          }
          error={errors.diplome_picture_1}
          helperText={file1 ? file1.name : undefined}
        />
        <FileInput
          label="Diplome picture 2"
          accept="image/*"
          onChange={handleFile2Change}
          currentFileUrl={
            isEditing && initialData?.diplome_picture_2 && !file2
              ? getFileUrl(initialData.diplome_picture_2)
              : null
          }
          error={errors.diplome_picture_2}
          helperText={file2 ? file2.name : undefined}
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

export default StudentDiplomeForm;

