import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import BaseModal from './BaseModal';
import { useCreateStudentContact, useUpdateStudentContact } from '../../hooks/useStudentContacts';
import { useStudentLinkTypes } from '../../hooks/useStudentLinkTypes';
import { useStudents } from '../../hooks/useStudents';
import type { SearchSelectOption } from '../inputs/SearchSelect';
import { StudentContactForm, type StudentContact } from '../forms';
import type { Student } from '../../api/students';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: StudentContact | null  | undefined;
}

const StudentContactModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
  const { t } = useTranslation();
  const createMut = useCreateStudentContact();
  const updateMut = useUpdateStudentContact();
  const { data: linkTypes } = useStudentLinkTypes({ page: 1, limit: 100 });
  const { data: studentsResp } = useStudents({ page: 1, limit: 100 });

  const studentOptions: SearchSelectOption[] = useMemo(() => {
    const students = (studentsResp?.data || []) as Student[];
    return students
      .filter((stu: Student) => stu?.status !== -2)
      .map((stu: Student) => {
        const fullName = `${stu.first_name ?? ''} ${stu.last_name ?? ''}`.trim();
        return {
          value: stu.id,
          label: fullName || stu.email || `Student #${stu.id}`,
        };
      });
  }, [studentsResp]);

  const handleSubmit = async (formData: {
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
  }) => {
    const payload: { firstname: string; lastname: string; birthday?: string; email?: string; phone?: string; adress?: string; city?: string; country?: string; student_id?: number; studentlinktypeId?: number; status: number } = {
      firstname: formData.firstname,
      lastname: formData.lastname,
      birthday: formData.birthday,
      email: formData.email,
      phone: formData.phone,
      adress: formData.adress,
      city: formData.city,
      country: formData.country,
      status: formData.status,
    };
    if (formData.studentlinktypeId !== '' && formData.studentlinktypeId !== null && formData.studentlinktypeId !== undefined) {
      payload.studentlinktypeId = typeof formData.studentlinktypeId === 'string' ? Number(formData.studentlinktypeId) : formData.studentlinktypeId;
    }
    if (formData.student_id !== '' && formData.student_id !== null && formData.student_id !== undefined) {
      payload.student_id = typeof formData.student_id === 'string' ? Number(formData.student_id) : formData.student_id;
    }
    if (item?.id) {
      await updateMut.mutateAsync({ id: item.id, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    onClose();
  };

  // Memoize linkTypes to prevent unnecessary re-renders
  const memoizedLinkTypes = useMemo(
    () => (linkTypes?.data || []) as Array<{ id: number; title: string }>,
    [linkTypes?.data]
  );

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={item ? t('forms.editContact') : t('forms.addContact')}>
      <StudentContactForm
        initialData={item}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMut.isPending || updateMut.isPending}
        studentOptions={studentOptions}
        linkTypes={memoizedLinkTypes}
      />
    </BaseModal>
  );
};

export default StudentContactModal;
