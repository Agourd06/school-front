import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useClassRooms } from '../../hooks/useClassRooms';
import { useCreateStudent, useUpdateStudent } from '../../hooks/useStudents';
import { STATUS_OPTIONS_FORM } from '../../constants/status';
import { validateRequired } from './validations';
import { useCreateStudentDiplome, useUpdateStudentDiplome } from '../../hooks/useStudentDiplomes';
import { useCreateStudentContact, useUpdateStudentContact } from '../../hooks/useStudentContacts';
import { useCreateStudentLinkType, useUpdateStudentLinkType } from '../../hooks/useStudentLinkTypes';

type StepKey = 'student' | 'diplome' | 'contact' | 'linkType';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const STEPS: Array<{ key: StepKey; label: string; description: string }> = [
  { key: 'student', label: 'Student', description: 'Basic details' },
  { key: 'diplome', label: 'Diplome', description: 'Academic record' },
  { key: 'contact', label: 'Contact', description: 'Guardian / emergency contact' },
  { key: 'linkType', label: 'Link Type', description: 'Relationship type' },
];

const initialStudentForm = {
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
};

const initialDiplomeForm = {
  title: '',
  school: '',
  diplome: '',
  annee: '' as string,
  country: '',
  city: '',
  status: 1 as number,
};

const initialContactForm = {
  firstname: '',
  lastname: '',
  birthday: '',
  email: '',
  phone: '',
  adress: '',
  city: '',
  country: '',
  studentlinktypeId: '' as number | string | '',
  status: 1 as number,
};

const StudentOnboardingModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [studentForm, setStudentForm] = useState(initialStudentForm);
  const [studentErrors, setStudentErrors] = useState<Record<string, string>>({});
  const [pictureFile, setPictureFile] = useState<File | null>(null);
  const [createdStudent, setCreatedStudent] = useState<any | null>(null);

  const [diplomeForm, setDiplomeForm] = useState(initialDiplomeForm);
  const [diplomeErrors, setDiplomeErrors] = useState<Record<string, string>>({});
  const [diplomeFile1, setDiplomeFile1] = useState<File | null>(null);
  const [diplomeFile2, setDiplomeFile2] = useState<File | null>(null);
  const [createdDiplome, setCreatedDiplome] = useState<any | null>(null);

  const [contactForm, setContactForm] = useState(initialContactForm);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [createdContact, setCreatedContact] = useState<any | null>(null);

  const [linkTypeTitle, setLinkTypeTitle] = useState('');
  const [linkTypeStatus, setLinkTypeStatus] = useState<number>(1);
  const [linkTypeError, setLinkTypeError] = useState('');
  const [createdLinkType, setCreatedLinkType] = useState<any | null>(null);

  const { data: classRooms } = useClassRooms({ page: 1, limit: 100 } as any);
  const createStudentMut = useCreateStudent();
  const updateStudentMut = useUpdateStudent();
  const createDiplomeMut = useCreateStudentDiplome();
  const updateDiplomeMut = useUpdateStudentDiplome();
  const createContactMut = useCreateStudentContact();
  const updateContactMut = useUpdateStudentContact();
  const createLinkTypeMut = useCreateStudentLinkType();
  const updateLinkTypeMut = useUpdateStudentLinkType();

  useEffect(() => {
    if (!isOpen) {
      resetState();
    }
  }, [isOpen]);

  const resetState = () => {
    setStepIndex(0);
    setStudentForm(initialStudentForm);
    setStudentErrors({});
    setPictureFile(null);
    setCreatedStudent(null);
    setDiplomeForm(initialDiplomeForm);
    setDiplomeErrors({});
    setDiplomeFile1(null);
    setDiplomeFile2(null);
    setCreatedDiplome(null);
    setContactForm(initialContactForm);
    setContactErrors({});
    setCreatedContact(null);
    setLinkTypeTitle('');
    setLinkTypeStatus(1);
    setLinkTypeError('');
    setCreatedLinkType(null);
  };

  const currentStep = STEPS[stepIndex];

  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudentForm((prev) => ({
      ...prev,
      [name]: name === 'company_id' || name === 'class_room_id'
        ? (value ? Number(value) : '')
        : name === 'status'
          ? Number(value)
          : value,
    }));
    if (studentErrors[name]) setStudentErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleStudentPicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setPictureFile(null);
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setStudentErrors((prev) => ({ ...prev, picture: 'Invalid file type (jpeg, png, gif, webp)' }));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStudentErrors((prev) => ({ ...prev, picture: 'Max size 2MB' }));
      return;
    }
    setStudentErrors((prev) => ({ ...prev, picture: '' }));
    setPictureFile(file);
  };

  const validateStudent = () => {
    const errors: Record<string, string> = {};
    const fnErr = validateRequired(studentForm.first_name, 'First name');
    if (fnErr) errors.first_name = fnErr;
    const lnErr = validateRequired(studentForm.last_name, 'Last name');
    if (lnErr) errors.last_name = lnErr;
    const emailErr = validateRequired(studentForm.email, 'Email');
    if (emailErr) errors.email = emailErr;
    setStudentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStudentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateStudent()) return;
    const formData = new FormData();
    formData.append('first_name', studentForm.first_name);
    formData.append('last_name', studentForm.last_name);
    formData.append('email', studentForm.email);
    if (studentForm.gender) formData.append('gender', studentForm.gender);
    if (studentForm.birthday) formData.append('birthday', studentForm.birthday);
    if (studentForm.phone) formData.append('phone', studentForm.phone);
    if (studentForm.address) formData.append('address', studentForm.address);
    if (studentForm.city) formData.append('city', studentForm.city);
    if (studentForm.country) formData.append('country', studentForm.country);
    if (studentForm.nationality) formData.append('nationality', studentForm.nationality);
    formData.append('company_id', '1');
    if (studentForm.status != null) formData.append('status', String(studentForm.status));
    if (studentForm.class_room_id !== '') formData.append('class_room_id', String(studentForm.class_room_id));
    if (pictureFile) formData.append('picture', pictureFile, pictureFile.name);

    try {
      if (createdStudent) {
        const updated = await updateStudentMut.mutateAsync({ id: createdStudent.id, data: formData });
        setCreatedStudent(updated);
      } else {
        const created = await createStudentMut.mutateAsync(formData as any);
        setCreatedStudent(created);
      }
      setStepIndex(1);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save student';
      setStudentErrors((prev) => ({ ...prev, form: message }));
    }
  };

  const studentStepContent = (
    <form onSubmit={handleStudentSubmit} className="space-y-4">
      {studentErrors.form && <p className="text-sm text-red-600">{studentErrors.form}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Picture</label>
          <input name="picture" type="file" accept="image/*" onChange={handleStudentPicture} className="mt-1 block w-full text-sm" />
          {studentErrors.picture && <p className="mt-1 text-sm text-red-600">{studentErrors.picture}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            name="email"
            type="email"
            value={studentForm.email}
            onChange={handleStudentChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${studentErrors.email ? 'border-red-300' : 'border-gray-300'}`}
          />
          {studentErrors.email && <p className="mt-1 text-sm text-red-600">{studentErrors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First name</label>
          <input
            name="first_name"
            value={studentForm.first_name}
            onChange={handleStudentChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${studentErrors.first_name ? 'border-red-300' : 'border-gray-300'}`}
          />
          {studentErrors.first_name && <p className="mt-1 text-sm text-red-600">{studentErrors.first_name}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last name</label>
          <input
            name="last_name"
            value={studentForm.last_name}
            onChange={handleStudentChange}
            className={`mt-1 block w-full px-3 py-2 border rounded-md ${studentErrors.last_name ? 'border-red-300' : 'border-gray-300'}`}
          />
          {studentErrors.last_name && <p className="mt-1 text-sm text-red-600">{studentErrors.last_name}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Gender</label>
          <select name="gender" value={studentForm.gender} onChange={handleStudentChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">Select</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Birthday</label>
          <input type="date" name="birthday" value={studentForm.birthday} onChange={handleStudentChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input name="phone" value={studentForm.phone} onChange={handleStudentChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Address</label>
        <input name="address" value={studentForm.address} onChange={handleStudentChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input name="city" value={studentForm.city} onChange={handleStudentChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input name="country" value={studentForm.country} onChange={handleStudentChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Nationality</label>
          <input name="nationality" value={studentForm.nationality} onChange={handleStudentChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select name="status" value={studentForm.status} onChange={handleStudentChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            {STATUS_OPTIONS_FORM.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Class Room</label>
          <select name="class_room_id" value={studentForm.class_room_id} onChange={handleStudentChange} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            <option value="">No class room</option>
            {(classRooms?.data || []).map((cr: any) => (
              <option key={cr.id} value={cr.id}>
                {cr.code} — {cr.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={() => {
            resetState();
            onClose();
          }}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          disabled={createStudentMut.isPending || updateStudentMut.isPending}
        >
          {createStudentMut.isPending || updateStudentMut.isPending ? 'Saving...' : createdStudent ? 'Update & Continue' : 'Save & Continue'}
        </button>
      </div>
    </form>
  );

  const validateDiplome = () => {
    const errors: Record<string, string> = {};
    if (!diplomeForm.title.trim()) errors.title = 'Title is required';
    if (!diplomeForm.school.trim()) errors.school = 'School is required';
    if (diplomeForm.annee && !/^[0-9]{4}$/.test(String(diplomeForm.annee))) errors.annee = 'Year must be YYYY';
    setDiplomeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDiplomeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!createdStudent) return;
    if (!validateDiplome()) return;
    try {
      const payload: any = {
        ...diplomeForm,
        annee: diplomeForm.annee ? String(diplomeForm.annee) : undefined,
        student_id: String(createdStudent.id),
        company_id: '1',
        status: diplomeForm.status != null ? String(diplomeForm.status) : undefined,
      };
      if (diplomeFile1) payload.diplome_picture_1 = diplomeFile1;
      if (diplomeFile2) payload.diplome_picture_2 = diplomeFile2;

      if (createdDiplome) {
        const updated = await updateDiplomeMut.mutateAsync({ id: createdDiplome.id, data: payload });
        setCreatedDiplome(updated);
      } else {
        const created = await createDiplomeMut.mutateAsync(payload);
        setCreatedDiplome(created);
      }
      setStepIndex(2);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save diplome';
      setDiplomeErrors((prev) => ({ ...prev, form: message }));
    }
  };

  const diplomeStepContent = (
    <form onSubmit={handleDiplomeSubmit} className="space-y-4">
      {diplomeErrors.form && <p className="text-sm text-red-600">{diplomeErrors.form}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Student</label>
          <input value={`${createdStudent?.first_name ?? ''} ${createdStudent?.last_name ?? ''}`.trim() || createdStudent?.email || '—'} disabled className="mt-1 block w-full px-3 py-2 border border-gray-200 rounded-md bg-gray-100" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select value={diplomeForm.status} onChange={(e) => setDiplomeForm((prev) => ({ ...prev, status: Number(e.target.value) }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            {STATUS_OPTIONS_FORM.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Title</label>
          <input name="title" value={diplomeForm.title} onChange={(e) => setDiplomeForm((prev) => ({ ...prev, title: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          {diplomeErrors.title && <p className="text-sm text-red-600">{diplomeErrors.title}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">School</label>
          <input name="school" value={diplomeForm.school} onChange={(e) => setDiplomeForm((prev) => ({ ...prev, school: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          {diplomeErrors.school && <p className="text-sm text-red-600">{diplomeErrors.school}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Diplome</label>
          <input name="diplome" value={diplomeForm.diplome} onChange={(e) => setDiplomeForm((prev) => ({ ...prev, diplome: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Year (YYYY)</label>
          <input name="annee" value={diplomeForm.annee} onChange={(e) => setDiplomeForm((prev) => ({ ...prev, annee: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          {diplomeErrors.annee && <p className="text-sm text-red-600">{diplomeErrors.annee}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input name="country" value={diplomeForm.country} onChange={(e) => setDiplomeForm((prev) => ({ ...prev, country: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input name="city" value={diplomeForm.city} onChange={(e) => setDiplomeForm((prev) => ({ ...prev, city: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Diplome picture 1</label>
            <input type="file" accept="image/*" onChange={(e) => setDiplomeFile1(e.target.files?.[0] || null)} className="mt-1 block w-full" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Diplome picture 2</label>
            <input type="file" accept="image/*" onChange={(e) => setDiplomeFile2(e.target.files?.[0] || null)} className="mt-1 block w-full" />
          </div>
        </div>
      </div>

      <div className="flex justify-between space-x-3 pt-4">
        <button type="button" onClick={() => setStepIndex(0)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
          Back
        </button>
        <div className="flex space-x-3">
          <button type="button" onClick={() => setStepIndex(2)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
            Skip
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            disabled={createDiplomeMut.isPending || updateDiplomeMut.isPending}
          >
            {createDiplomeMut.isPending || updateDiplomeMut.isPending ? 'Saving...' : createdDiplome ? 'Update & Continue' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </form>
  );

  const validateContact = () => {
    const errors: Record<string, string> = {};
    if (!contactForm.firstname.trim()) errors.firstname = 'First name is required';
    if (!contactForm.lastname.trim()) errors.lastname = 'Last name is required';
    if (contactForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) errors.email = 'Invalid email';
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateContact()) return;
    try {
      const payload: any = { ...contactForm, company_id: 1 };
      if (!payload.studentlinktypeId) delete payload.studentlinktypeId;

      if (createdContact) {
        const updated = await updateContactMut.mutateAsync({ id: createdContact.id, data: payload });
        setCreatedContact(updated);
      } else {
        const created = await createContactMut.mutateAsync(payload);
        setCreatedContact(created);
      }
      setStepIndex(3);
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save contact';
      setContactErrors((prev) => ({ ...prev, form: message }));
    }
  };

  const contactStepContent = (
    <form onSubmit={handleContactSubmit} className="space-y-4">
      {contactErrors.form && <p className="text-sm text-red-600">{contactErrors.form}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">First name</label>
          <input name="firstname" value={contactForm.firstname} onChange={(e) => setContactForm((prev) => ({ ...prev, firstname: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          {contactErrors.firstname && <p className="text-sm text-red-600">{contactErrors.firstname}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Last name</label>
          <input name="lastname" value={contactForm.lastname} onChange={(e) => setContactForm((prev) => ({ ...prev, lastname: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          {contactErrors.lastname && <p className="text-sm text-red-600">{contactErrors.lastname}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Birthday</label>
          <input name="birthday" type="date" value={contactForm.birthday} onChange={(e) => setContactForm((prev) => ({ ...prev, birthday: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input name="email" value={contactForm.email} onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
          {contactErrors.email && <p className="text-sm text-red-600">{contactErrors.email}</p>}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone</label>
          <input name="phone" value={contactForm.phone} onChange={(e) => setContactForm((prev) => ({ ...prev, phone: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Status</label>
          <select value={contactForm.status} onChange={(e) => setContactForm((prev) => ({ ...prev, status: Number(e.target.value) }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
            {STATUS_OPTIONS_FORM.filter((opt) => opt.value !== -2).map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Address</label>
          <input name="adress" value={contactForm.adress} onChange={(e) => setContactForm((prev) => ({ ...prev, adress: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">City</label>
          <input name="city" value={contactForm.city} onChange={(e) => setContactForm((prev) => ({ ...prev, city: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700">Country</label>
          <input name="country" value={contactForm.country} onChange={(e) => setContactForm((prev) => ({ ...prev, country: e.target.value }))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" />
        </div>
      </div>

      <div className="flex justify-between space-x-3 pt-4">
        <button type="button" onClick={() => setStepIndex(1)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
          Back
        </button>
        <div className="flex space-x-3">
          <button type="button" onClick={() => setStepIndex(3)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
            Skip
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            disabled={createContactMut.isPending || updateContactMut.isPending}
          >
            {createContactMut.isPending || updateContactMut.isPending ? 'Saving...' : createdContact ? 'Update & Continue' : 'Save & Continue'}
          </button>
        </div>
      </div>
    </form>
  );

  const handleLinkTypeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLinkTypeError('');
    if (!linkTypeTitle.trim()) {
      setLinkTypeError('Title is required');
      return;
    }
    try {
      if (createdLinkType) {
        const updated = await updateLinkTypeMut.mutateAsync({ id: createdLinkType.id, data: { title: linkTypeTitle, status: linkTypeStatus, company_id: 1 } as any });
        setCreatedLinkType(updated);
      } else {
        const created = await createLinkTypeMut.mutateAsync({ title: linkTypeTitle, status: linkTypeStatus, company_id: 1 } as any);
        setCreatedLinkType(created);
      }
      resetState();
      onClose();
    } catch (err: any) {
      const message = err?.response?.data?.message || 'Failed to save link type';
      setLinkTypeError(message);
    }
  };

  const linkTypeStepContent = (
    <form onSubmit={handleLinkTypeSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Relationship title</label>
        <input value={linkTypeTitle} onChange={(e) => setLinkTypeTitle(e.target.value)} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md" placeholder="Parent, Guardian..." />
        {linkTypeError && <p className="mt-1 text-sm text-red-600">{linkTypeError}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Status</label>
        <select value={linkTypeStatus} onChange={(e) => setLinkTypeStatus(Number(e.target.value))} className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md">
          {STATUS_OPTIONS_FORM.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex justify-between space-x-3 pt-4">
        <button type="button" onClick={() => setStepIndex(2)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200">
          Back
        </button>
        <div className="flex space-x-3">
          <button
            type="button"
            onClick={() => {
              resetState();
              onClose();
            }}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
          >
            Skip
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            disabled={createLinkTypeMut.isPending || updateLinkTypeMut.isPending}
          >
            {createLinkTypeMut.isPending || updateLinkTypeMut.isPending ? 'Saving...' : createdLinkType ? 'Update & Finish' : 'Finish'}
          </button>
        </div>
      </div>
    </form>
  );

  let content: React.ReactNode;
  if (currentStep.key === 'student') content = studentStepContent;
  else if (currentStep.key === 'diplome') content = diplomeStepContent;
  else if (currentStep.key === 'contact') content = contactStepContent;
  else content = linkTypeStepContent;

  return (
    <BaseModal isOpen={isOpen} onClose={() => { resetState(); onClose(); }} title="Add Student">
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {STEPS.map((step, index) => {
            const isActive = index === stepIndex;
            const isCompleted = index < stepIndex;
            return (
              <div
                key={step.key}
                className={`flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                  isActive ? 'bg-blue-600 text-white' : isCompleted ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                }`}
              >
                <span className="mr-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-current">
                  {index + 1}
                </span>
                <span>{step.label}</span>
              </div>
            );
          })}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-4">{currentStep.description}</h4>
          {content}
        </div>
      </div>
    </BaseModal>
  );
};

export default StudentOnboardingModal;


