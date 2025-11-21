import React from "react";
import BaseModal from "./BaseModal";
import {
  useCreateClassRoom,
  useUpdateClassRoom,
} from "../../hooks/useClassRooms";
import { ClassRoomForm, type ClassRoom } from "../forms";

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

  const isEditing = !!classRoom;

  const handleSubmit = async (formData: { code: string; title: string; capacity: string; status: number }) => {
      const payload: CreateClassRoomRequest = {
      code: formData.code,
      title: formData.title,
      capacity: Number(formData.capacity || 0),
      status: Number(formData.status),
    };

    if (isEditing && classRoom?.id) {
      await updateMutation.mutateAsync({ id: classRoom.id, ...payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
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
      />
    </BaseModal>
  );
};

export default ClassRoomModal;
