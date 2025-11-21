import React from "react";
import { useCreateCourse, useUpdateCourse } from "../../hooks/useCourses";
import BaseModal from "./BaseModal";
import { CourseForm, type Course } from "../forms";

interface CourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  course?: Course | null;
}

const CourseModal: React.FC<CourseModalProps> = ({
  isOpen,
  onClose,
  course,
}) => {
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const isEditing = !!course;

  const handleSubmit = async (formData: {
    title: string;
    description: string;
    volume: string;
    coefficient: string;
    status: number;
  }) => {
    const descriptionToSave = formData.description.trim() || undefined;

    if (isEditing && course) {
      await updateCourse.mutateAsync({
        id: course.id,
        title: formData.title,
        description: descriptionToSave,
        volume: formData.volume ? Number(formData.volume) : undefined,
        coefficient: formData.coefficient ? Number(formData.coefficient) : undefined,
        status: formData.status,
      });
    } else {
      await createCourse.mutateAsync({
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
      title={isEditing ? "Edit Course" : "Add Course"}
    >
      <CourseForm
        initialData={course}
        onSubmit={handleSubmit}
        onCancel={onClose}
        isSubmitting={createCourse.isPending || updateCourse.isPending}
      />
    </BaseModal>
  );
};

export default CourseModal;
