import React, { useState } from 'react';
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
import type { PaginatedResponse } from '../../types/api';
import type { StudentLinkType } from '../../api/studentLinkType';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onStudentCreated?: (studentEmail: string) => void;
}

const StudentOnboardingModalContent: React.FC<{ onClose: () => void; onStudentCreated?: (studentEmail: string) => void }> = ({ onClose, onStudentCreated }) => {
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

  const handlers = useStudentModalHandlers({
    onStepComplete: (nextStep: number) => setStepIndex(nextStep),
    onFinish: () => {
      onClose();
    },
    onStudentCreated,
  });

  // Delete mutations
  const deleteContactMut = useDeleteStudentContact();
  const deleteDiplomeMut = useDeleteStudentDiplome();

  const handleStudentPicture = handlers.handleStudentPicture;

  const currentStep = STEPS[stepIndex];

  // Handlers for diplome "Add Another" functionality
  const handleDiplomeSubmitWrapper = async (e: React.FormEvent) => {
    await handlers.handleDiplomeSubmit(e, async () => {
      setJustSavedDiplome(true);
      // Wait a bit for the mutation to complete and query to update
      await new Promise(resolve => setTimeout(resolve, 100));
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

  const renderStepContent = () => {
    switch (currentStep.key) {
      case 'student':
        return (
          <StudentStep
            form={studentForm}
            errors={studentErrors}
            pictureFile={pictureFile}
            currentPictureUrl={undefined}
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
            onSkip={onClose}
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

const StudentOnboardingModal: React.FC<Props> = ({ isOpen, onClose, onStudentCreated }) => {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Add Student">
      <StudentModalProvider initialStudentId={null}>
        <StudentOnboardingModalContent onClose={onClose} onStudentCreated={onStudentCreated} />
      </StudentModalProvider>
    </BaseModal>
  );
};

export default StudentOnboardingModal;


