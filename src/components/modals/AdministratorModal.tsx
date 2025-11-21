import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateAdministrator, useUpdateAdministrator } from '../../hooks/useAdministrators';
import { useClassRooms } from '../../hooks/useClassRooms';
import { validateRequired } from './validations';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { Input, Select, FileInput, Button } from '../ui';

interface AdministratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  administrator?: any | null;
}

const AdministratorModal: React.FC<AdministratorModalProps> = ({ isOpen, onClose, administrator }) => {
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

  const createMutation = useCreateAdministrator();
  const updateMutation = useUpdateAdministrator();
  const { data: classRooms } = useClassRooms({ limit: 100, page: 1 } as any);

  const isEditing = !!administrator;

  useEffect(() => {
    if (administrator) {
      setForm({
        gender: administrator.gender || '',
        first_name: administrator.first_name || '',
        last_name: administrator.last_name || '',
        birthday: administrator.birthday || '',
        email: administrator.email || '',
        phone: administrator.phone || '',
        address: administrator.address || '',
        city: administrator.city || '',
        country: administrator.country || '',
        nationality: administrator.nationality || '',
        picture: administrator.picture || '',
        status: typeof administrator.status === 'number' ? administrator.status : 1,
        company_id: administrator.company_id ?? '',
        class_room_id: administrator.class_room_id ?? '',
      });
    } else {
      setForm({
        gender: '', first_name: '', last_name: '', birthday: '', email: '', phone: '', address: '', city: '', country: '', nationality: '', picture: '', status: 1, company_id: '', class_room_id: ''
      });
    }
    setErrors({});
  }, [administrator, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: (name === 'company_id' || name === 'class_room_id')
        ? (value ? Number(value) : '')
        : name === 'status'
          ? Number(value)
          : value,
    }));
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
    // company_id is automatically set by the API from authenticated user
    if (form.status != null) formData.append('status', String(form.status));
    if (form.class_room_id !== '') formData.append('class_room_id', String(form.class_room_id));
    if (pictureFile instanceof File) formData.append('picture', pictureFile, pictureFile.name);

    if (isEditing && administrator?.id) {
      await updateMutation.mutateAsync({ id: administrator.id, data: formData });
    } else {
      await createMutation.mutateAsync(formData as any);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Administrator' : 'Add Administrator'}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FileInput
            label="Picture"
            name="picture"
            accept="image/*"
            onChange={(file) => setPictureFile(file)}
            error={errors.picture}
            className="text-sm"
          />
          <Input
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="First name"
            name="first_name"
            value={form.first_name}
            onChange={handleChange}
            error={errors.first_name}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Input
            label="Last name"
            name="last_name"
            value={form.last_name}
            onChange={handleChange}
            error={errors.last_name}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Gender"
            name="gender"
            value={form.gender}
            onChange={handleChange}
            options={[
              { value: '', label: 'Select' },
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
            ]}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Input
            label="Birthday"
            type="date"
            name="birthday"
            value={form.birthday}
            onChange={handleChange}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Input
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <Input
          label="Address"
          name="address"
          value={form.address}
          onChange={handleChange}
          className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label="City"
            name="city"
            value={form.city}
            onChange={handleChange}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Input
            label="Country"
            name="country"
            value={form.country}
            onChange={handleChange}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Input
            label="Nationality"
            name="nationality"
            value={form.nationality}
            onChange={handleChange}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Status"
            name="status"
            value={form.status}
            onChange={handleChange}
            options={STATUS_OPTIONS_FORM.map(opt => ({
              value: opt.value,
              label: opt.label,
            }))}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <Select
            label="Class Room"
            name="class_room_id"
            value={form.class_room_id}
            onChange={handleChange}
            options={[
              { value: '', label: 'No class room' },
              ...((classRooms?.data || []).map((cr: any) => ({
                value: cr.id,
                label: `${cr.code} — ${cr.title}`,
              })))
            ]}
            className="shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary">{isEditing ? 'Update' : 'Create'}</Button>
        </div>
      </form>
    </BaseModal>
  );
};

export default AdministratorModal;


