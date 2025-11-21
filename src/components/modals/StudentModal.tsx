import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { StudentModalProvider, useStudentModalContext } from './student/StudentModalContext';
import { useStudentModalHandlers } from './student/useStudentModalHandlers';
import StudentStep from './student/StudentStep';
import DiplomeStep from './student/DiplomeStep';
import ContactStep from './student/ContactStep';
import LinkTypeStep from './student/LinkTypeStep';
import StepProgress from './student/StepProgress';
import { STEPS } from './student/constants';
import type { Student } from '../../api/students';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
}

const StudentModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const {
    studentForm,
    studentErrors,
    pictureFile,
    diplomeForm,
    diplomeErrors,
    diplomeFile1,
    diplomeFile2,
    currentDiplome,
    contactForm,
    contactErrors,
    currentContact,
    linkTypeTitle,
    linkTypeStatus,
    linkTypeError,
    currentLinkType,
    classRooms,
    studentDetailsData,
    linkTypesData,
    studentName,
    setDiplomeForm,
    setContactForm,
    setLinkTypeTitle,
    setLinkTypeStatus,
    setDiplomeFile1,
    setDiplomeFile2,
  } = useStudentModalContext();

  // Get all handlers from custom hook
  const handlers = useStudentModalHandlers({
    onStepComplete: (nextStep: number) => setStepIndex(nextStep),
    onFinish: onClose,
  });

  // Reset form when modal closes
  useEffect(() => {
    setStepIndex(0);
  }, []);

  const currentStep = STEPS[stepIndex];

  // Handle picture change - use handler directly
  const handleStudentPicture = handlers.handleStudentPicture;

  // Render step content based on current step
  const renderStepContent = () => {
    switch (currentStep.key) {
      case 'student':
        return (
          <StudentStep
            form={studentForm}
            errors={studentErrors}
            pictureFile={pictureFile}
            currentPictureUrl={studentDetailsData?.student?.picture}
            classRooms={classRooms}
            onChange={handlers.handleStudentChange}
            onPictureChange={handleStudentPicture}
            onSubmit={handlers.handleStudentSubmit}
            onCancel={onClose}
            isSubmitting={handlers.createStudentMut.isPending || handlers.updateStudentMut.isPending}
          />
        );

      case 'diplome':
        return (
          <DiplomeStep
            form={diplomeForm}
            errors={diplomeErrors}
            diplomeFile1={diplomeFile1}
            diplomeFile2={diplomeFile2}
            currentDiplomePicture1={studentDetailsData?.diploma?.diplome_picture_1}
            currentDiplomePicture2={studentDetailsData?.diploma?.diplome_picture_2}
            studentName={studentName}
            onFormChange={(field, value) => setDiplomeForm((prev) => ({ ...prev, [field]: value }))}
            onFile1Change={setDiplomeFile1}
            onFile2Change={setDiplomeFile2}
            onSubmit={handlers.handleDiplomeSubmit}
            onBack={() => setStepIndex(0)}
            onSkip={() => setStepIndex(2)}
            isSubmitting={handlers.createDiplomeMut.isPending || handlers.updateDiplomeMut.isPending}
            hasDiplome={!!currentDiplome}
          />
        );

      case 'contact':
        return (
          <ContactStep
            form={contactForm}
            errors={contactErrors}
            linkTypesData={linkTypesData}
            studentName={studentName}
            onFormChange={(field, value) => setContactForm((prev) => ({ ...prev, [field]: value }))}
            onSubmit={handlers.handleContactSubmit}
            onBack={() => setStepIndex(1)}
            onSkip={() => setStepIndex(3)}
            isSubmitting={handlers.createContactMut.isPending || handlers.updateContactMut.isPending}
            hasContact={!!currentContact}
          />
        );

      case 'linkType':
        return (
          <LinkTypeStep
            title={linkTypeTitle}
            status={linkTypeStatus}
            error={linkTypeError}
            onTitleChange={setLinkTypeTitle}
            onStatusChange={setLinkTypeStatus}
            onSubmit={handlers.handleLinkTypeSubmit}
            onBack={() => setStepIndex(2)}
            isSubmitting={handlers.createLinkTypeMut.isPending || handlers.updateLinkTypeMut.isPending}
            hasLinkType={!!currentLinkType}
          />
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <StepProgress steps={STEPS} currentIndex={stepIndex} />

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <h4 className="text-sm font-medium text-gray-700 mb-4">{currentStep.description}</h4>
        {renderStepContent()}
      </div>
    </div>
  );
};

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, student }) => {
  // This modal is only for editing - requires a student ID
  if (!student?.id) {
    console.warn('StudentModal requires a student with an ID for editing');
    return null;
  }

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Student">
      <StudentModalProvider initialStudentId={student.id}>
        <StudentModalContent onClose={onClose} />
      </StudentModalProvider>
    </BaseModal>
  );
};

export default StudentModal;
