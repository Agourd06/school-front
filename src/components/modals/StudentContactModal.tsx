import React, { useEffect, useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentContact, useUpdateStudentContact } from '../../hooks/useStudentContacts';
import { useStudentLinkTypes } from '../../hooks/useStudentLinkTypes';
import { useStudents } from '../../hooks/useStudents';
import SearchSelect, { type SearchSelectOption } from '../inputs/SearchSelect';
import { Input, Select, Button } from '../ui';
import { STATUS_OPTIONS_FORM } from '../../constants/status';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: any | null;
}

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const StudentContactModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
  const [form, setForm] = useState({
    firstname: '',
    lastname: '',
    birthday: '',
    email: '',
    phone: '',
    adress: '',
    city: '',
    country: '',
    student_id: '' as number | string | '',
    studentlinktypeId: '' as number | string | '',
    status: 1 as number,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const createMut = useCreateStudentContact();
  const updateMut = useUpdateStudentContact();
  const { data: linkTypes } = useStudentLinkTypes({ page: 1, limit: 100 });
  const { data: studentsResp } = useStudents({ page: 1, limit: 100 } as any);
  
  const studentOptions: SearchSelectOption[] = useMemo(() => {
    const students = ((studentsResp as any)?.data || []) as any[];
    return students
      .filter((stu: any) => stu?.status !== -2)
      .map((stu: any) => {
        const fullName = `${stu.first_name ?? ''} ${stu.last_name ?? ''}`.trim();
        return {
          value: stu.id,
          label: fullName || stu.email || `Student #${stu.id}`,
        };
      });
  }, [studentsResp]);

  const isEditing = !!item;

  useEffect(() => {
    if (item) {
      setForm({
        firstname: item.firstname || '',
        lastname: item.lastname || '',
        birthday: item.birthday || '',
        email: item.email || '',
        phone: item.phone || '',
        adress: item.adress || '',
        city: item.city || '',
        country: item.country || '',
        student_id: item.student_id ?? '',
        studentlinktypeId: item.studentlinktypeId ?? '',
        status: typeof item.status === 'number' ? item.status : 1,
      });
    } else {
      setForm({ firstname: '', lastname: '', birthday: '', email: '', phone: '', adress: '', city: '', country: '', student_id: '', studentlinktypeId: '', status: 1 });
    }
    setErrors({});
  }, [item, isOpen]);

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
    setForm(prev => ({
      ...prev,
      [name]: name === 'studentlinktypeId' || name === 'student_id'
        ? (value ? (name === 'student_id' ? Number(value) : String(value)) : '')
        : name === 'status'
          ? Number(value)
          : value,
    }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleStudentChange = (value: number | string | '') => {
    setForm(prev => ({
      ...prev,
      student_id: value === '' ? '' : Number(value),
    }));
    if (errors.student_id) setErrors(prev => ({ ...prev, student_id: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const eMap = validate();
    if (Object.keys(eMap).length) { setErrors(eMap); return; }
    try {
      // company_id is automatically set by the API from authenticated user
      const payload = { ...form } as any;
      if (payload.studentlinktypeId === '') delete payload.studentlinktypeId;
      if (payload.student_id === '') delete payload.student_id;
      else payload.student_id = Number(payload.student_id);
      if (isEditing) await updateMut.mutateAsync({ id: item.id, data: payload });
      else await createMut.mutateAsync(payload);
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to save';
      setErrors(prev => ({ ...prev, form: msg }));
    }
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Contact' : 'Add Contact'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {errors.form && <p className="text-sm text-red-600">{errors.form}</p>}
        
        <div>
          <SearchSelect
            label={isEditing ? "Student" : "Student *"}
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
              ...(((linkTypes as any)?.data) || []).map((lt: any) => ({
                value: lt.id,
                label: lt.title,
              }))
            ]}
          />
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
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEditing ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentContactModal;


