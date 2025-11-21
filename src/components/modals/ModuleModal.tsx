import React from "react";
import { useCreateModule, useUpdateModule } from "../../hooks/useModules";
import BaseModal from "./BaseModal";
import { ModuleForm, type Module } from "../forms";

interface ModuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  module?: Module | null;
}

const ModuleModal: React.FC<ModuleModalProps> = ({
  isOpen,
  onClose,
  module,
}) => {
  const createModule = useCreateModule();
  const updateModule = useUpdateModule();

  const isEditing = !!module;

  const handleSubmit = async (formData: {
    title: string;
    description: string;
    volume: string;
    coefficient: string;
    status: number;
  }) => {
    const descriptionToSave = formData.description.trim() || undefined;

    if (isEditing && module) {
      await updateModule.mutateAsync({
        id: module.id,
        title: formData.title,
        description: descriptionToSave,
        volume: formData.volume ? Number(formData.volume) : undefined,
        coefficient: formData.coefficient ? Number(formData.coefficient) : undefined,
        status: formData.status,
      });
    } else {
      await createModule.mutateAsync({
        title: formData.title,
        description: descriptionToSave,
        volume: formData.volume ? Number(formData.volume) : undefined,
        coefficient: formData.coefficient ? Number(formData.coefficient) : undefined,
        status: formData.status,
      });
    }

    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Module" : "Add Module"}
    >
      <ModuleForm
        initialData={module}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createModule.isPending || updateModule.isPending}
      />
    </BaseModal>
  );
};

export default ModuleModal;
