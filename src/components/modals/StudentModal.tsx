import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudent, useUpdateStudent } from '../../hooks/useStudents';
import { useClassRooms } from '../../hooks/useClassRooms';
import { validateRequired } from './validations';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: any | null;
}

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, student }) => {
  const [form, setForm] = useState({
    gender: '',
    first_name: '',
    last_name: '',
    birthday: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    country: '',
    nationality: '',
    picture: '',
    status: 1 as number,
    company_id: '' as number | '',
    class_room_id: '' as number | '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pictureFile, setPictureFile] = useState<File | null>(null);

  const createMutation = useCreateStudent();
  const updateMutation = useUpdateStudent();
  const { data: classRooms } = useClassRooms({ limit: 100, page: 1 } as any);

  const isEditing = !!student;

  useEffect(() => {
    if (student) {
      setForm({
        gender: student.gender || '',
        first_name: student.first_name || '',
        last_name: student.last_name || '',
        birthday: student.birthday || '',
        email: student.email || '',
        phone: student.phone || '',
        address: student.address || '',
        city: student.city || '',
        country: student.country || '',
        nationality: student.nationality || '',
        picture: student.picture || '',
        status: typeof student.status === 'number' ? student.status : 1,
        company_id: student.company_id ?? '',
        class_room_id: student.class_room_id ?? '',
      });
    } else {
      setForm({
        gender: '', first_name: '', last_name: '', birthday: '', email: '', phone: '', address: '', city: '', country: '', nationality: '', picture: '', status: 1, company_id: '', class_room_id: ''
      });
    }
    setErrors({});
  }, [student, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: (name === 'company_id' || name === 'class_room_id') ? (value ? Number(value) : '') : value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePictureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] || null;
    if (!f) { setPictureFile(null); return; }
    const validTypes = ['image/jpeg','image/png','image/gif','image/webp'];
    if (!validTypes.includes(f.type)) {
      setErrors(prev => ({ ...prev, picture: 'Invalid file type. Allowed: jpeg, png, gif, webp' }));
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, picture: 'File too large. Max 2MB' }));
      return;
    }
    setErrors(prev => ({ ...prev, picture: '' }));
    setPictureFile(f);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const fnErr = validateRequired(form.first_name, 'First name'); if (fnErr) newErrors.first_name = fnErr;
    const lnErr = validateRequired(form.last_name, 'Last name'); if (lnErr) newErrors.last_name = lnErr;
    const emailErr = validateRequired(form.email, 'Email'); if (emailErr) newErrors.email = emailErr;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const formData = new FormData();
    formData.append('first_name', form.first_name);
    formData.append('last_name', form.last_name);
    formData.append('email', form.email);
    if (form.gender) formData.append('gender', form.gender);
    if (form.birthday) formData.append('birthday', form.birthday);
    if (form.phone) formData.append('phone', form.phone);
    if (form.address) formData.append('address', form.address);
    if (form.city) formData.append('city', form.city);
    if (form.country) formData.append('country', form.country);
    if (form.nationality) formData.append('nationality', form.nationality);
    formData.append('company_id', '1');
    if (form.status != null) formData.append('status', String(form.status));
    if (form.class_room_id !== '') formData.append('class_room_id', String(form.class_room_id));
    if (pictureFile instanceof File) formData.append('picture', pictureFile, pictureFile.name);

    if (isEditing && student?.id) {
      await updateMutation.mutateAsync({ id: student.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData as any);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Student' : 'Add Student'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Picture</label>
            <input name="picture" type="file" accept="image/*" onChange={handlePictureChange} className="mt-1 block w-full text-sm" />
            {errors.picture && <p className="mt-1 text-sm text-red-600">{errors.picture}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.email ? 'border-red-300' : 'border-gray-300'}`} />
            {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">First name</label>
            <input name="first_name" value={form.first_name} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.first_name ? 'border-red-300' : 'border-gray-300'}`} />
            {errors.first_name && <p className="mt-1 text-sm text-red-600">{errors.first_name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Last name</label>
            <input name="last_name" value={form.last_name} onChange={handleChange} className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm ${errors.last_name ? 'border-red-300' : 'border-gray-300'}`} />
            {errors.last_name && <p className="mt-1 text-sm text-red-600">{errors.last_name}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Gender</label>
            <select name="gender" value={form.gender} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              <option value="">Select</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Birthday</label>
            <input type="date" name="birthday" value={form.birthday} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input name="phone" value={form.phone} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input name="address" value={form.address} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input name="city" value={form.city} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <input name="country" value={form.country} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Nationality</label>
            <input name="nationality" value={form.nationality} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select name="status" value={form.status} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              <option value={-2}>Deleted (-2)</option>
              <option value={-1}>Archived (-1)</option>
              <option value={0}>Disabled (0)</option>
              <option value={1}>Active (1)</option>
              <option value={2}>Pending (2)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Class Room</label>
            <select name="class_room_id" value={form.class_room_id} onChange={handleChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
              <option value="">No class room</option>
              {(classRooms?.data || []).map((cr: any) => (
                <option key={cr.id} value={cr.id}>{cr.code} — {cr.title}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500">Cancel</button>
          <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">{isEditing ? 'Update' : 'Create'}</button>
        </div>
      </form>
    </BaseModal>
  );
};

export default StudentModal;


