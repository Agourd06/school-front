import React, { useState } from "react";
import BaseModal from "./BaseModal";
import {
  useCreateClassRoom,
  useUpdateClassRoom,
} from "../../hooks/useClassRooms";
import { ClassRoomForm, type ClassRoom } from "../forms";
import type { CreateClassRoomRequest } from "../../api/classRoom";

interface ClassRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  classRoom?: ClassRoom | null;
}

const ClassRoomModal: React.FC<ClassRoomModalProps> = ({
  isOpen,
  onClose,
  classRoom,
}) => {
  const createMutation = useCreateClassRoom();
  const updateMutation = useUpdateClassRoom();
  const [serverError, setServerError] = useState<string | null>(null);

  const isEditing = !!classRoom;

  const handleSubmit = async (formData: { code: string; title: string; capacity: string; classroom_type_id: number | ''; status: number }) => {
    setServerError(null);

    const payload: CreateClassRoomRequest = {
      code: formData.code,
      title: formData.title,
      capacity: Number(formData.capacity || 0),
      status: Number(formData.status),
      classroom_type_id: formData.classroom_type_id === '' ? null : Number(formData.classroom_type_id),
    };

    try {
      if (isEditing && classRoom?.id) {
        await updateMutation.mutateAsync({ id: classRoom.id, ...payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      onClose();
    } catch (error: unknown) {
      const axiosError = error as { response?: { data?: { message?: string | string[] } }; message?: string };
      const dataMessage = axiosError?.response?.data?.message;
      let errorMessage = 'An error occurred while saving the classroom.';
      
      if (Array.isArray(dataMessage)) {
        errorMessage = dataMessage.join(', ');
      } else if (typeof dataMessage === 'string') {
        errorMessage = dataMessage;
      } else if (typeof axiosError.message === 'string') {
        errorMessage = axiosError.message;
      }
      
      setServerError(errorMessage);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Classroom" : "Add Classroom"}
    >
      <ClassRoomForm
        initialData={classRoom}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        serverError={serverError}
      />
    </BaseModal>
  );
};

export default ClassRoomModal;
