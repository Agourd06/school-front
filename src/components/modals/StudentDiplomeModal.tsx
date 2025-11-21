import React, { useMemo, useState } from 'react';
import BaseModal from './BaseModal';
import { useCreateStudentDiplome, useUpdateStudentDiplome } from '../../hooks/useStudentDiplomes';
import { useStudents } from '../../hooks/useStudents';
import type { Student } from '../../api/students';
import { StudentDiplomeForm, type StudentDiplome } from '../forms';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item?: StudentDiplome | null;
}

const StudentDiplomeModal: React.FC<Props> = ({ isOpen, onClose, item }) => {
  const [studentSearch, setStudentSearch] = useState('');

  const createMut = useCreateStudentDiplome();
  const updateMut = useUpdateStudentDiplome();
  const { data: studentsResp, isLoading: studentsLoading, error: studentsError } = useStudents({
    page: 1,
    limit: 20,
    search: studentSearch ? studentSearch.trim() : undefined,
  });

  const studentOptions = useMemo(
    () =>
      ((studentsResp as { data?: Student[] })?.data || []).map((s: Student) => ({
        value: s.id,
        label: `${s.first_name ?? ''} ${s.last_name ?? ''}`.trim() || s.email || `ID ${s.id}`,
      })),
    [studentsResp]
  );

  const handleSubmit = async (
    formData: {
      title: string;
      school: string;
      diplome: string;
      annee: string;
      country: string;
      city: string;
      student_id: number | string | '';
      status: number;
    },
    file1: File | null,
    file2: File | null
  ) => {
    const payload: { title: string; school: string; diplome?: string; annee?: string; country?: string; city?: string; student_id: number | string; status: number; diplome_picture_1?: File; diplome_picture_2?: File } = {
      ...formData,
      annee: formData.annee ? String(formData.annee) : undefined,
      student_id: formData.student_id,
      status: formData.status != null ? String(formData.status) : undefined,
    };
    if (file1) payload.diplome_picture_1 = file1;
    if (file2) payload.diplome_picture_2 = file2;
    if (item?.id) {
      await updateMut.mutateAsync({ id: item.id, data: payload });
    } else {
      await createMut.mutateAsync(payload);
    }
    onClose();
  };

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={item ? 'Edit Diplome' : 'Add Diplome'}>
      <StudentDiplomeForm
        initialData={item}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMut.isPending || updateMut.isPending}
        studentOptions={studentOptions}
        studentsLoading={studentsLoading}
        studentsError={studentsError}
        onStudentSearchChange={setStudentSearch}
      />
    </BaseModal>
  );
};

export default StudentDiplomeModal;
