import React, { useMemo } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentContact, useUpdateStudentContact } from '../../hooks/useStudentContacts';
import { useStudentLinkTypes } from '../../hooks/useStudentLinkTypes';
import { useStudents } from '../../hooks/useStudents';
import type { SearchSelectOption } from '../inputs/SearchSelect';
import { StudentContactForm, type StudentContact } from '../forms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: StudentContact | null;
}

const StudentContactModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
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
    const payload: { firstname: string; lastname: string; birthday?: string; email?: string; phone?: string; adress?: string; city?: string; country?: string; student_id?: number; studentlinktypeId?: number; status: number } = { ...formData };
    if (payload.studentlinktypeId === '') delete payload.studentlinktypeId;
    if (payload.student_id === '') delete payload.student_id;
    else payload.student_id = Number(payload.student_id);
    if (item?.id) {
      await updateMut.mutateAsync({ id: item.id, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Contact' : 'Add Contact'}>
      <StudentContactForm
        initialData={item}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMut.isPending || updateMut.isPending}
        studentOptions={studentOptions}
        linkTypes={(linkTypes?.data || []) as Array<{ id: number; title: string }>}
      />
    </BaseModal>
  );
};

export default StudentContactModal;
