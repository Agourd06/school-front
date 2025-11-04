import React, { useEffect, useState, useMemo } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentDiplome, useUpdateStudentDiplome } from '../../hooks/useStudentDiplomes';
import SearchSelect from '../inputs/SearchSelect';
import { useStudents } from '../../hooks/useStudents';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: any | null;
}

const apiBase = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';
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

  const createMut = useCreateStudentDiplome();
  const updateMut = useUpdateStudentDiplome();
  const { data: studentsResp, isLoading: studentsLoading, error: studentsError } = useStudents({ page: 1, limit: 200 } as any);
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
    setForm(prev => ({ ...prev, [name]: name === 'student_id' ? (value ? String(value) : '') : value }));
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
      const payload: any = {
        ...form,
        annee: form.annee ? String(form.annee) : undefined,
        student_id: form.student_id,
        company_id: '1',
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input name="title" value={form.title} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            {errors.title && <p className="text-sm text-red-600">{errors.title}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">School</label>
            <input name="school" value={form.school} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            {errors.school && <p className="text-sm text-red-600">{errors.school}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Diplome</label>
            <input name="diplome" value={form.diplome} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Year (YYYY)</label>
            <input name="annee" value={form.annee} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
            {errors.annee && <p className="text-sm text-red-600">{errors.annee}</p>}
          </div>
          <div>
            <SearchSelect
              label="Student"
              value={form.student_id}
              onChange={(val) => setForm(prev => ({ ...prev, student_id: val }))}
              placeholder="Search students..."
              options={studentOptions}
              isLoading={studentsLoading}
              error={studentsError ? 'Failed to load students' : null}
            />
            {errors.student_id && <p className="text-sm text-red-600">{errors.student_id}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input name="country" value={form.country} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input name="city" value={form.city} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" value={form.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value={-2}>Deleted (-2)</option>
            <option value={-1}>Archived (-1)</option>
            <option value={0}>Disabled (0)</option>
            <option value={1}>Active (1)</option>
            <option value={2}>Pending (2)</option>
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Diplome picture 1</label>
            <input type="file" accept="image/*" onChange={handleFile('file1')} className="mt-1 block w-full" />
            {errors.diplome_picture_1 && <p className="text-sm text-red-600">{errors.diplome_picture_1}</p>}
            {isEditing && item?.diplome_picture_1 && !file1 && (
              <img src={`${apiBase}${item.diplome_picture_1}`} alt="current 1" className="mt-2 h-16 w-16 object-cover border rounded" />
            )}
            {file1 && <p className="text-xs text-gray-500 mt-1">{file1.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Diplome picture 2</label>
            <input type="file" accept="image/*" onChange={handleFile('file2')} className="mt-1 block w-full" />
            {errors.diplome_picture_2 && <p className="text-sm text-red-600">{errors.diplome_picture_2}</p>}
            {isEditing && item?.diplome_picture_2 && !file2 && (
              <img src={`${apiBase}${item.diplome_picture_2}`} alt="current 2" className="mt-2 h-16 w-16 object-cover border rounded" />
            )}
            {file2 && <p className="text-xs text-gray-500 mt-1">{file2.name}</p>}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700">{isEditing ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentDiplomeModal;


