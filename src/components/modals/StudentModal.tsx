import React, { useEffect, useState } from 'react';
import BaseModal from './BaseModal';
import { StudentModalProvider, useStudentModalContext } from './student/StudentModalContext';
import { useStudentModalHandlers } from './student/useStudentModalHandlers';
import { useDeleteStudentContact } from '../../hooks/useStudentContacts';
import { useDeleteStudentDiplome } from '../../hooks/useStudentDiplomes';
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
    studentId,
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
    allContacts,
    allDiplomes,
    refetchContacts,
    refetchDiplomes,
    studentName,
    setDiplomeForm,
    setContactForm,
    setDiplomeFile1,
    setDiplomeFile2,
    setCurrentDiplome,
    setCurrentContact,
    refetchStudentDetails,
  } = useStudentModalContext();

  // Get all handlers from custom hook
  const handlers = useStudentModalHandlers({
    onStepComplete: (nextStep: number) => setStepIndex(nextStep),
    onFinish: onClose,
  });

  // Delete mutations
  const deleteContactMut = useDeleteStudentContact();
  const deleteDiplomeMut = useDeleteStudentDiplome();

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
      refetchDiplomes(); // Refetch to update the list
    });
  };

  const handleDiplomeAddAnother = () => {
    handlers.resetDiplomeForm();
    setCurrentDiplome(null);
    setDiplomeFile1(null);
    setDiplomeFile2(null);
    setJustSavedDiplome(false);
  };

  const handleDiplomeContinue = async () => {
    setJustSavedDiplome(false);
    // Refetch student details and diplomes before continuing to get latest data
    refetchStudentDetails();
    refetchDiplomes();
    setStepIndex(2);
  };

  const handleEditDiplome = (diplome: typeof allDiplomes[0]) => {
    setCurrentDiplome(diplome);
    setDiplomeForm({
      title: diplome.title || '',
      school: diplome.school || '',
      diplome: diplome.diplome || '',
      annee: diplome.annee ? String(diplome.annee) : '',
      country: diplome.country || '',
      city: diplome.city || '',
      status: diplome.status || 1,
    });
    setDiplomeFile1(null);
    setDiplomeFile2(null);
    setJustSavedDiplome(false);
  };

  const handleDeleteDiplome = async (diplomeId: number) => {
    if (window.confirm('Are you sure you want to delete this diplome?')) {
      try {
        await deleteDiplomeMut.mutateAsync(diplomeId);
        refetchDiplomes();
        refetchStudentDetails();
        // If the deleted diplome was being edited, clear the form
        if (currentDiplome?.id === diplomeId) {
          setCurrentDiplome(null);
          handlers.resetDiplomeForm();
        }
      } catch (error) {
        console.error('Failed to delete diplome:', error);
      }
    }
  };

  // Handlers for contact "Add Another" functionality
  const handleContactSubmitWrapper = async (e: React.FormEvent) => {
    await handlers.handleContactSubmit(e, () => {
      setJustSavedContact(true);
      refetchContacts(); // Refetch to update the list
    });
  };

  const handleContactAddAnother = () => {
    handlers.resetContactForm();
    setCurrentContact(null);
    setJustSavedContact(false);
  };

  const handleContactContinue = async () => {
    setJustSavedContact(false);
    // Refetch student details and contacts before continuing to get latest data
    refetchStudentDetails();
    refetchContacts();
    onClose();
  };

  const handleEditContact = (contact: typeof allContacts[0]) => {
    setCurrentContact(contact);
    setContactForm({
      firstname: contact.firstname || '',
      lastname: contact.lastname || '',
      birthday: contact.birthday || '',
      email: contact.email || '',
      phone: contact.phone || '',
      adress: contact.adress || '',
      city: contact.city || '',
      country: contact.country || '',
      studentlinktypeId: contact.studentlinktypeId ?? '',
      status: contact.status || 1,
    });
    setJustSavedContact(false);
  };

  const handleDeleteContact = async (contactId: number) => {
    if (window.confirm('Are you sure you want to delete this contact?')) {
      try {
        await deleteContactMut.mutateAsync(contactId);
        refetchContacts();
        refetchStudentDetails();
        // If the deleted contact was being edited, clear the form
        if (currentContact?.id === contactId) {
          setCurrentContact(null);
          handlers.resetContactForm();
        }
      } catch (error) {
        console.error('Failed to delete contact:', error);
      }
    }
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
            isEditMode={!!studentId}
          />
        );

      case 'diplome':
        return (
          <DiplomeStep
            form={diplomeForm}
            errors={diplomeErrors}
            diplomeFile1={diplomeFile1}
            diplomeFile2={diplomeFile2}
            currentDiplomePicture1={currentDiplome?.diplome_picture_1 || studentDetailsData?.diploma?.diplome_picture_1}
            currentDiplomePicture2={currentDiplome?.diplome_picture_2 || studentDetailsData?.diploma?.diplome_picture_2}
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
            allDiplomes={allDiplomes}
            onEditDiplome={handleEditDiplome}
            onDeleteDiplome={handleDeleteDiplome}
            currentDiplomeId={currentDiplome?.id}
            isDeletingDiplome={deleteDiplomeMut.isPending}
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
            allContacts={allContacts}
            onEditContact={handleEditContact}
            onDeleteContact={handleDeleteContact}
            currentContactId={currentContact?.id}
            isDeletingContact={deleteContactMut.isPending}
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
