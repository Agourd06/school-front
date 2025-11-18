import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { useStudentModalData } from './student/useStudentModalData';
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

const StudentModal: React.FC<StudentModalProps> = ({ isOpen, onClose, student }) => {
  // This modal is only for editing - requires a student ID
  if (!student?.id) {
    console.warn('StudentModal requires a student with an ID for editing');
    return null;
  }

  const studentId = student.id;
  const [stepIndex, setStepIndex] = useState(0);

  // Get all form data and state from custom hook
  const {
    studentForm,
    setStudentForm,
    studentErrors,
    setStudentErrors,
    pictureFile,
    setPictureFile,
    diplomeForm,
    setDiplomeForm,
    diplomeErrors,
    setDiplomeErrors,
    diplomeFile1,
    setDiplomeFile1,
    diplomeFile2,
    setDiplomeFile2,
    currentDiplome,
    contactForm,
    setContactForm,
    contactErrors,
    setContactErrors,
    currentContact,
    linkTypeTitle,
    setLinkTypeTitle,
    linkTypeStatus,
    setLinkTypeStatus,
    linkTypeError,
    setLinkTypeError,
    currentLinkType,
    classRooms,
    studentDetailsData,
    refetchStudentDetails,
    linkTypesData,
    setCurrentDiplomeFn,
    setCurrentContactFn,
    setCurrentLinkTypeFn,
  } = useStudentModalData(studentId);

  // Get all handlers from custom hook
  const handlers = useStudentModalHandlers({
    studentId,
    studentForm,
    setStudentForm,
    studentErrors,
    setStudentErrors,
    pictureFile,
    setPictureFile,
    diplomeForm,
    setDiplomeForm,
    diplomeErrors,
    setDiplomeErrors,
    diplomeFile1,
    diplomeFile2,
    currentDiplome,
    setCurrentDiplome: setCurrentDiplomeFn,
    contactForm,
    setContactForm,
    contactErrors,
    setContactErrors,
    currentContact,
    setCurrentContact: setCurrentContactFn,
    linkTypeTitle,
    setLinkTypeTitle,
    linkTypeStatus,
    setLinkTypeStatus,
    linkTypeError,
    setLinkTypeError,
    currentLinkType,
    setCurrentLinkType: setCurrentLinkTypeFn,
    refetchStudentDetails,
    onStepComplete: (nextStep: number) => setStepIndex(nextStep),
    onFinish: onClose,
  });

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setStepIndex(0);
      setStudentErrors({});
      setDiplomeErrors({});
      setContactErrors({});
      setLinkTypeError('');
      setPictureFile(null);
      setDiplomeFile1(null);
      setDiplomeFile2(null);
    }
  }, [isOpen, setStudentErrors, setDiplomeErrors, setContactErrors, setLinkTypeError, setPictureFile, setDiplomeFile1, setDiplomeFile2]);

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
            isSubmitting={handlers.updateStudentMut.isPending}
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
            studentName={
              `${studentDetailsData?.student?.first_name ?? ''} ${studentDetailsData?.student?.last_name ?? ''}`.trim() ||
              studentDetailsData?.student?.email ||
              '—'
            }
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
    <BaseModal isOpen={isOpen} onClose={onClose} title="Edit Student">
      <div className="space-y-6">
        <StepProgress steps={STEPS} currentIndex={stepIndex} />

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-medium text-gray-700 mb-4">{currentStep.description}</h4>
          {renderStepContent()}
        </div>
      </div>
    </BaseModal>
  );
};

export default StudentModal;
