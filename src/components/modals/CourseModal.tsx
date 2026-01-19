import React from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();

  const isEditing = !!course;

  const handleSubmit = async (formData: {
    title: string;
    description: string;
    volume: string;
    coefficient: string;
    status: number;
    pdf_file?: File | null;
  }) => {
    const descriptionToSave = formData.description.trim() || undefined;
    const hasPdf = formData.pdf_file instanceof File;

    // If PDF is provided, use FormData
    if (hasPdf) {
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      if (descriptionToSave) {
        formDataToSend.append('description', descriptionToSave);
      }
      // Only append volume if it has a valid value
      if (formData.volume !== undefined && formData.volume !== null && formData.volume !== '') {
        const volumeNum = typeof formData.volume === 'number' ? formData.volume : Number(formData.volume);
        if (!isNaN(volumeNum) && volumeNum >= 0) {
          formDataToSend.append('volume', volumeNum.toString());
        }
      }
      // Only append coefficient if it has a valid value
      if (formData.coefficient !== undefined && formData.coefficient !== null && formData.coefficient !== '') {
        const coeffNum = typeof formData.coefficient === 'number' ? formData.coefficient : Number(formData.coefficient);
        if (!isNaN(coeffNum) && coeffNum >= 0) {
          formDataToSend.append('coefficient', coeffNum.toString());
        }
      }
      // Always send status as a number string (required field)
      formDataToSend.append('status', formData.status.toString());
      if (formData.pdf_file instanceof File) {
        formDataToSend.append('pdf_file', formData.pdf_file);
      }

      if (isEditing && course) {
        await updateCourse.mutateAsync({ id: course.id, formData: formDataToSend });
      } else {
        await createCourse.mutateAsync(formDataToSend as any);
      }
    } else {
      // No PDF, use regular JSON
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
    }

    onClose();
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? t('sections.editCourse') : t('sections.addCourse')}
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
