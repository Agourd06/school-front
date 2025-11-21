import React, { useEffect, useState, useMemo } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentDiplome, useUpdateStudentDiplome } from '../../hooks/useStudentDiplomes';
import SearchSelect from '../inputs/SearchSelect';
import { useStudents } from '../../hooks/useStudents';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { getFileUrl } from '../../utils/apiConfig';
import { Input, Select, FileInput, Button } from '../ui';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: any | null;
}
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

const StudentDiplomeModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
  const [form, setForm] = useState({
    title: '',
    school: '',
    diplome: '',
    annee: '' as string,
    country: '',
    city: '',
    student_id: '' as number | string | '',
    status: 1 as number,
  });
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [studentSearch, setStudentSearch] = useState('');

  const createMut = useCreateStudentDiplome();
  const updateMut = useUpdateStudentDiplome();
  const { data: studentsResp, isLoading: studentsLoading, error: studentsError } = useStudents({ page: 1, limit: 20, search: studentSearch ? studentSearch.trim() : undefined } as any);
  const studentOptions = useMemo(
    () => ((studentsResp as any)?.data || []).map((s: any) => ({
      value: s.id,
      label: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || `ID ${s.id}`,
    })),
    [studentsResp]
  );

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setForm({
        title: item.title || '',
        school: item.school || '',
        diplome: item.diplome || '',
        annee: item.annee ? String(item.annee) : '',
        country: item.country || '',
        city: item.city || '',
        student_id: item.student_id ?? '',
        status: typeof item.status === 'number' ? item.status : 1,
      });
      setFile1(null);
      setFile2(null);
    } else {
      setForm({ title: '', school: '', diplome: '', annee: '', country: '', city: '', student_id: '', status: 1 });
      setFile1(null);
      setFile2(null);
    }
    setErrors({});
    setStudentSearch('');
  }, [item, isOpen]);

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
    setForm(prev => ({
      ...prev,
      [name]: name === 'student_id'
        ? (value ? String(value) : '')
        : name === 'status'
          ? Number(value)
          : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleFile = (name: 'file1' | 'file2') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (name === 'file1') setFile1(f);
    else setFile2(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) { setErrors(eMap); return; }
    try {
      // company_id is automatically set by the API from authenticated user
      const payload: any = {
        ...form,
        annee: form.annee ? String(form.annee) : undefined,
        student_id: form.student_id,
        status: form.status != null ? String(form.status) : undefined,
      };
      if (file1) payload.diplome_picture_1 = file1;
      if (file2) payload.diplome_picture_2 = file2;
      if (isEditing) await updateMut.mutateAsync({ id: item.id, data: payload });
      else await createMut.mutateAsync(payload);
      onClose();
    } catch (err: any) {
      setErrors(prev => ({ ...prev, form: err?.response?.data?.message || 'Failed to save' }));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Diplome' : 'Add Diplome'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}

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
              onChange={(val) => setForm(prev => ({ ...prev, student_id: val }))}
              placeholder="Search students..."
              options={studentOptions}
              isLoading={studentsLoading}
              error={studentsError ? 'Failed to load students' : null}
              onSearchChange={(query) => setStudentSearch(query)}
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
          options={STATUS_OPTIONS_FORM.map(opt => ({
            value: opt.value,
            label: opt.label,
          }))}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileInput
            label="Diplome picture 1"
            accept="image/*"
            onChange={(file) => setFile1(file)}
            currentFileUrl={isEditing && item?.diplome_picture_1 && !file1 ? getFileUrl(item.diplome_picture_1) : null}
            error={errors.diplome_picture_1}
            helperText={file1 ? file1.name : undefined}
          />
          <FileInput
            label="Diplome picture 2"
            accept="image/*"
            onChange={(file) => setFile2(file)}
            currentFileUrl={isEditing && item?.diplome_picture_2 && !file2 ? getFileUrl(item.diplome_picture_2) : null}
            error={errors.diplome_picture_2}
            helperText={file2 ? file2.name : undefined}
          />
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEditing ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentDiplomeModal;


