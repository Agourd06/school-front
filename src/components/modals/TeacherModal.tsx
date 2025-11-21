import React from 'react';
import BaseModal from './BaseModal';
import { useCreateTeacher, useUpdateTeacher } from '../../hooks/useTeachers';
import { useClassRooms } from '../../hooks/useClassRooms';
import { TeacherForm, type Teacher } from '../forms';

interface TeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher?: Teacher | null;
}

const TeacherModal: React.FC<TeacherModalProps> = ({ isOpen, onClose, teacher }) => {
  const createMutation = useCreateTeacher();
  const updateMutation = useUpdateTeacher();
  const { data: classRooms } = useClassRooms({ limit: 100, page: 1 } as any);

  const isEditing = !!teacher;

  const handleSubmit = async (
    formData: {
      gender: string;
      first_name: string;
      last_name: string;
      birthday: string;
      email: string;
      phone: string;
      address: string;
      city: string;
      country: string;
      nationality: string;
      picture: string;
      status: number;
      class_room_id: number | '';
    },
    pictureFile: File | null
  ) => {
    const formDataObj = new FormData();
    formDataObj.append('first_name', formData.first_name);
    formDataObj.append('last_name', formData.last_name);
    formDataObj.append('email', formData.email);
    if (formData.gender) formDataObj.append('gender', formData.gender);
    if (formData.birthday) formDataObj.append('birthday', formData.birthday);
    if (formData.phone) formDataObj.append('phone', formData.phone);
    if (formData.address) formDataObj.append('address', formData.address);
    if (formData.city) formDataObj.append('city', formData.city);
    if (formData.country) formDataObj.append('country', formData.country);
    if (formData.nationality) formDataObj.append('nationality', formData.nationality);
    if (formData.status != null) formDataObj.append('status', String(formData.status));
    if (formData.class_room_id !== '') formDataObj.append('class_room_id', String(formData.class_room_id));
    if (pictureFile instanceof File) formDataObj.append('picture', pictureFile, pictureFile.name);

    if (isEditing && teacher?.id) {
      await updateMutation.mutateAsync({ id: teacher.id, data: formDataObj });
    } else {
      await createMutation.mutateAsync(formDataObj as any);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Teacher' : 'Add Teacher'}>
      <TeacherForm
        initialData={teacher}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        classRooms={(classRooms?.data || []) as Array<{ id: number; code: string; title: string }>}
      />
    </BaseModal>
  );
};

export default TeacherModal;
