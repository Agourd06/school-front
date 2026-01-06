import { useUpdateStudent, useCreateStudent } from '../../../hooks/useStudents';
import { useCreateStudentDiplome, useUpdateStudentDiplome } from '../../../hooks/useStudentDiplomes';
import { useCreateStudentContact, useUpdateStudentContact } from '../../../hooks/useStudentContacts';
import { useCreateStudentLinkType, useUpdateStudentLinkType } from '../../../hooks/useStudentLinkTypes';
import { validateRequired } from '../validations';
import { useStudentModalContext } from './StudentModalContext';
import { initialDiplomeForm, initialContactForm } from './constants';
import type { StudentFormData } from './types';

interface UseStudentModalHandlersProps {
  onStepComplete: (nextStep: number) => void;
  onFinish: () => void;
  onStudentCreated?: (studentEmail: string) => void;
}

export const useStudentModalHandlers = (props: UseStudentModalHandlersProps) => {
  const { onStepComplete, onFinish, onStudentCreated } = props;
  
  const {
    studentId,
    setStudentId,
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
    setCurrentDiplome,
    contactForm,
    setContactForm,
    contactErrors,
    setContactErrors,
    currentContact,
    setCurrentContact,
    linkTypeTitle,
    linkTypeStatus,
    setLinkTypeError,
    currentLinkType,
    setCurrentLinkType,
    refetchStudentDetails,
  } = useStudentModalContext();

  const createStudentMut = useCreateStudent();
  const updateStudentMut = useUpdateStudent();
  const createDiplomeMut = useCreateStudentDiplome();
  const updateDiplomeMut = useUpdateStudentDiplome();
  const createContactMut = useCreateStudentContact();
  const updateContactMut = useUpdateStudentContact();
  const createLinkTypeMut = useCreateStudentLinkType();
  const updateLinkTypeMut = useUpdateStudentLinkType();

  // Student handlers
  const handleStudentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setStudentForm({
      ...studentForm,
      [name]: name === 'status' ? Number(value) : value,
    } as StudentFormData);
    // Clear error for this field when user starts typing
    if (studentErrors[name]) {
      const newErrors = { ...studentErrors };
      delete newErrors[name];
      // Also clear form error if it's the same as the field error
      if (newErrors.form === studentErrors[name]) {
        delete newErrors.form;
      }
      setStudentErrors(newErrors);
    }
  };

  const handleStudentPicture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) {
      setPictureFile(null);
      return;
    }
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setStudentErrors({ ...studentErrors, picture: 'Invalid file type (jpeg, png, gif, webp)' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStudentErrors({ ...studentErrors, picture: 'Max size 2MB' });
      return;
    }
    setStudentErrors({ ...studentErrors, picture: '' });
    setPictureFile(file);
  };

  const validateStudent = () => {
    const errors: Record<string, string> = {};
    const fnErr = validateRequired(studentForm.first_name, 'First name');
    if (fnErr) errors.first_name = fnErr;
    const lnErr = validateRequired(studentForm.last_name, 'Last name');
    if (lnErr) errors.last_name = lnErr;
    const emailErr = validateRequired(studentForm.email, 'Email');
    if (emailErr) errors.email = emailErr;
    setStudentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleStudentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateStudent()) return;

    const formData = new FormData();
    formData.append('first_name', studentForm.first_name);
    formData.append('last_name', studentForm.last_name);
    formData.append('email', studentForm.email);
    if (studentForm.gender) formData.append('gender', studentForm.gender);
    if (studentForm.birthday) formData.append('birthday', studentForm.birthday);
    if (studentForm.phone) formData.append('phone', studentForm.phone);
    if (studentForm.address) formData.append('address', studentForm.address);
    if (studentForm.city) formData.append('city', studentForm.city);
    if (studentForm.country) formData.append('country', studentForm.country);
    if (studentForm.nationality) formData.append('nationality', studentForm.nationality);
    if (studentId) {
      // When updating, allow status change
      if (studentForm.status != null) formData.append('status', String(studentForm.status));
    } else {
      // When creating, always set status to 2 (pending)
      formData.append('status', '2');
    }
    if (pictureFile) formData.append('picture', pictureFile, pictureFile.name);

    try {
      let result;
      if (studentId) {
        // Update existing student
        result = await updateStudentMut.mutateAsync({ id: studentId, data: formData });
      } else {
        // Create new student
        result = await createStudentMut.mutateAsync(formData);
        // Set the student ID in context for subsequent steps
        if (result?.id) {
          setStudentId(result.id);
        }
        // Note: Backend automatically creates a user account with profile 'student'
        // and sends a password invitation email to the student's email address
        // Notify parent component about successful creation
        if (onStudentCreated && result?.email) {
          onStudentCreated(result.email);
        }
      }
      await refetchStudentDetails();
      onStepComplete(1);
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string | string[]; statusCode?: number } }; message?: string };
      const dataMessage = axiosError?.response?.data?.message;
      
      // Extract message - handle both string and array cases
      let message: string;
      if (Array.isArray(dataMessage)) {
        message = dataMessage.join(', ');
      } else if (typeof dataMessage === 'string') {
        message = dataMessage;
      } else if (typeof axiosError.message === 'string') {
        message = axiosError.message;
      } else {
        message = 'Failed to save student';
      }
      
      const errors: Record<string, string> = {};
      
      // Check if the error is related to email validation (duplicate email, etc.)
      const messageLower = message.toLowerCase();
      if (
        messageLower.includes('email') ||
        messageLower.includes('student with email') ||
        messageLower.includes('user with email') ||
        messageLower.includes('already exists') ||
        messageLower.includes('duplicate entry')
      ) {
        // Set error on email field for better UX
        errors.email = message;
        // Also show as form error for visibility
        errors.form = message;
      } else {
        // For other errors, show as form error
        errors.form = message;
      }
      
      setStudentErrors(errors);
    }
  };

  // Diplome handlers
  const validateDiplome = () => {
    const errors: Record<string, string> = {};
    if (!diplomeForm.title.trim()) errors.title = 'Title is required';
    if (!diplomeForm.school.trim()) errors.school = 'School is required';
    if (diplomeForm.annee && !/^[0-9]{4}$/.test(String(diplomeForm.annee))) errors.annee = 'Year must be YYYY';
    setDiplomeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDiplomeSubmit = async (event: React.FormEvent, onSuccess?: () => void) => {
    event.preventDefault();
    if (!validateDiplome()) return;

    if (!studentId) {
      setDiplomeErrors({ ...diplomeErrors, form: 'Student ID is required. Please save the student first.' });
      return;
    }

    const payload: { title: string; school: string; diplome?: string; annee?: string; country?: string; city?: string; student_id: string; status?: string; diplome_picture_1?: File; diplome_picture_2?: File } = {
      ...diplomeForm,
      annee: diplomeForm.annee ? String(diplomeForm.annee) : undefined,
      student_id: String(studentId),
      status: diplomeForm.status != null ? String(diplomeForm.status) : undefined,
    };
    if (diplomeFile1) payload.diplome_picture_1 = diplomeFile1;
    if (diplomeFile2) payload.diplome_picture_2 = diplomeFile2;

    try {
      let result;
      if (currentDiplome) {
        result = await updateDiplomeMut.mutateAsync({ id: currentDiplome.id, data: payload });
        setCurrentDiplome(result);
      } else {
        result = await createDiplomeMut.mutateAsync(payload);
        setCurrentDiplome(result);
      }
      if (onSuccess) {
        // Don't refetch yet when using Add Another flow - will refetch when continuing
        onSuccess();
      } else {
        await refetchStudentDetails();
        onStepComplete(2);
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || 'Failed to save diplome';
      setDiplomeErrors({ ...diplomeErrors, form: message });
    }
  };

  // Contact handlers
  const validateContact = () => {
    const errors: Record<string, string> = {};
    if (!contactForm.firstname.trim()) errors.firstname = 'First name is required';
    if (!contactForm.lastname.trim()) errors.lastname = 'Last name is required';
    if (contactForm.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactForm.email)) errors.email = 'Invalid email';
    setContactErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleContactSubmit = async (event: React.FormEvent, onSuccess?: () => void) => {
    event.preventDefault();
    if (!validateContact()) return;

    if (!studentId) {
      setContactErrors({ ...contactErrors, form: 'Student ID is required. Please save the student first.' });
      return;
    }

    const studentIdNumber = Number(studentId);
    if (isNaN(studentIdNumber) || studentIdNumber < 1 || !Number.isInteger(studentIdNumber)) {
      setContactErrors({ ...contactErrors, form: 'Invalid student ID. Please save the student first.' });
      return;
    }

    try {
      const payload: { firstname: string; lastname: string; student_id: number; birthday?: string; email?: string; phone?: string; adress?: string; city?: string; country?: string; status?: number; studentlinktypeId?: number } = {
        firstname: contactForm.firstname,
        lastname: contactForm.lastname,
        student_id: studentIdNumber,
      };

      if (contactForm.birthday) payload.birthday = contactForm.birthday;
      if (contactForm.email) payload.email = contactForm.email;
      if (contactForm.phone) payload.phone = contactForm.phone;
      if (contactForm.adress) payload.adress = contactForm.adress;
      if (contactForm.city) payload.city = contactForm.city;
      if (contactForm.country) payload.country = contactForm.country;
      if (contactForm.status) payload.status = Number(contactForm.status);

      if (contactForm.studentlinktypeId && contactForm.studentlinktypeId !== '' && contactForm.studentlinktypeId !== null) {
        const linkTypeId = Number(contactForm.studentlinktypeId);
        if (!isNaN(linkTypeId) && linkTypeId > 0) {
          payload.studentlinktypeId = linkTypeId;
        }
      }

      let result;
      if (currentContact) {
        result = await updateContactMut.mutateAsync({ id: currentContact.id, data: payload });
        setCurrentContact(result);
      } else {
        result = await createContactMut.mutateAsync(payload);
        setCurrentContact(result);
      }
      if (onSuccess) {
        // Don't refetch yet when using Add Another flow - will refetch when continuing
        onSuccess();
      } else {
        await refetchStudentDetails();
        onFinish();
      }
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || 'Failed to save contact';
      setContactErrors({ ...contactErrors, form: message });
    }
  };

  // Link type handlers
  const handleLinkTypeSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLinkTypeError('');
    if (!linkTypeTitle.trim()) {
      setLinkTypeError('Title is required');
      return;
    }

    if (!studentId) {
      setLinkTypeError('Student ID is required. Please save the student first.');
      return;
    }

    try {
      let linkTypeId: number;
      if (currentLinkType) {
        const updated = await updateLinkTypeMut.mutateAsync({
          id: currentLinkType.id,
          data: { title: linkTypeTitle, status: linkTypeStatus },
        });
        setCurrentLinkType(updated);
        linkTypeId = updated.id;
      } else {
        const created = await createLinkTypeMut.mutateAsync({
          title: linkTypeTitle,
          status: linkTypeStatus,
        });
        setCurrentLinkType(created);
        linkTypeId = created.id;
      }

      const studentIdNumber = Number(studentId);
      if (currentContact && studentIdNumber && studentIdNumber >= 1 && !isNaN(studentIdNumber)) {
        try {
          await updateContactMut.mutateAsync({
            id: currentContact.id,
            data: {
              student_id: studentIdNumber,
              studentlinktypeId: linkTypeId,
            },
          });
        } catch (contactErr) {
          console.error('Failed to update contact with link type:', contactErr);
        }
      } else if (studentIdNumber && studentIdNumber >= 1 && !isNaN(studentIdNumber) && !currentContact) {
        try {
          const newContact = await createContactMut.mutateAsync({
            firstname: '',
            lastname: '',
            student_id: studentIdNumber,
            studentlinktypeId: linkTypeId,
            status: 1,
          });
          setCurrentContact(newContact);
        } catch (contactErr) {
          console.error('Failed to create contact with link type:', contactErr);
        }
      }

      await refetchStudentDetails();
      onFinish();
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { message?: string } } };
      const message = axiosError?.response?.data?.message || 'Failed to save link type';
      setLinkTypeError(message);
    }
  };

  // Reset handlers for "Add Another" functionality
  const resetDiplomeForm = () => {
    setDiplomeForm(initialDiplomeForm);
    setDiplomeFile1(null);
    setDiplomeFile2(null);
    setCurrentDiplome(null);
    setDiplomeErrors({});
  };

  const resetContactForm = () => {
    setContactForm(initialContactForm);
    setCurrentContact(null);
    setContactErrors({});
  };

  return {
    // Student
    handleStudentChange,
    handleStudentPicture,
    handleStudentSubmit,
    createStudentMut,
    updateStudentMut,

    // Diplome
    handleDiplomeSubmit,
    resetDiplomeForm,
    createDiplomeMut,
    updateDiplomeMut,

    // Contact
    handleContactSubmit,
    resetContactForm,
    createContactMut,
    updateContactMut,

    // Link type
    handleLinkTypeSubmit,
    createLinkTypeMut,
    updateLinkTypeMut,
  };
};

