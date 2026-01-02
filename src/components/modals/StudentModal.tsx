import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { StudentModalProvider, useStudentModalContext } from './student/StudentModalContext';
import { useStudentModalHandlers } from './student/useStudentModalHandlers';
import StudentStep from './student/StudentStep';
import DiplomeStep from './student/DiplomeStep';
import ContactStep from './student/ContactStep';
import StepProgress from './student/StepProgress';
import { STEPS } from './student/constants';
import type { Student } from '../../api/students';
import type { PaginatedResponse } from '../../types/api';
import type { StudentLinkType } from '../../api/studentLinkType';

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
}

const StudentModalContent: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [stepIndex, setStepIndex] = useState(0);
  const [justSavedDiplome, setJustSavedDiplome] = useState(false);
  const [justSavedContact, setJustSavedContact] = useState(false);
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
    studentDetailsData,
    linkTypesData,
    studentName,
    setDiplomeForm,
    setContactForm,
    setDiplomeFile1,
    setDiplomeFile2,
    refetchStudentDetails,
  } = useStudentModalContext();

  // Get all handlers from custom hook
  const handlers = useStudentModalHandlers({
    onStepComplete: (nextStep: number) => setStepIndex(nextStep),
    onFinish: onClose,
  });

  // Reset form when modal closes
  useEffect(() => {
    setStepIndex(0);
    setJustSavedDiplome(false);
    setJustSavedContact(false);
  }, []);

  const currentStep = STEPS[stepIndex];

  // Handle picture change - use handler directly
  const handleStudentPicture = handlers.handleStudentPicture;

  // Handlers for diplome "Add Another" functionality
  const handleDiplomeSubmitWrapper = async (e: React.FormEvent) => {
    await handlers.handleDiplomeSubmit(e, () => {
      setJustSavedDiplome(true);
    });
  };

  const handleDiplomeAddAnother = () => {
    handlers.resetDiplomeForm();
    setJustSavedDiplome(false);
  };

  const handleDiplomeContinue = async () => {
    setJustSavedDiplome(false);
    // Refetch student details before continuing to get latest data
    refetchStudentDetails();
    setStepIndex(2);
  };

  // Handlers for contact "Add Another" functionality
  const handleContactSubmitWrapper = async (e: React.FormEvent) => {
    await handlers.handleContactSubmit(e, () => {
      setJustSavedContact(true);
    });
  };

  const handleContactAddAnother = () => {
    handlers.resetContactForm();
    setJustSavedContact(false);
  };

  const handleContactContinue = async () => {
    setJustSavedContact(false);
    // Refetch student details before continuing to get latest data
    refetchStudentDetails();
    onClose();
  };

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
            onFormChange={(field, value) => setDiplomeForm({ ...diplomeForm, [field]: value })}
            onFile1Change={setDiplomeFile1}
            onFile2Change={setDiplomeFile2}
            onSubmit={handleDiplomeSubmitWrapper}
            onBack={() => setStepIndex(0)}
            onSkip={() => setStepIndex(2)}
            isSubmitting={handlers.createDiplomeMut.isPending || handlers.updateDiplomeMut.isPending}
            hasDiplome={!!currentDiplome}
            justSaved={justSavedDiplome}
            onAddAnother={handleDiplomeAddAnother}
            onContinue={handleDiplomeContinue}
          />
        );

      case 'contact':
        return (
          <ContactStep
            form={contactForm}
            errors={contactErrors}
            linkTypesData={linkTypesData as PaginatedResponse<StudentLinkType> | null | undefined}
            studentName={studentName}
            onFormChange={(field, value) => setContactForm({ ...contactForm, [field]: value })}
            onSubmit={handleContactSubmitWrapper}
            onBack={() => setStepIndex(1)}
            onSkip={() => setStepIndex(3)}
            isSubmitting={handlers.createContactMut.isPending || handlers.updateContactMut.isPending}
            hasContact={!!currentContact}
            justSaved={justSavedContact}
            onAddAnother={handleContactAddAnother}
            onContinue={handleContactContinue}
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
  // Only check and warn when modal is actually open to avoid unnecessary warnings
  if (isOpen && !student?.id) {
    console.warn('StudentModal requires a student with an ID for editing');
    return null;
  }

  // Don't render if modal is closed or student is missing
  if (!isOpen || !student?.id) {
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
