import { useState, useEffect } from 'react';
import { useStudentDetails } from '../../../hooks/useStudents';
import { useClassRooms } from '../../../hooks/useClassRooms';
import { useStudentLinkTypes } from '../../../hooks/useStudentLinkTypes';
import { initialStudentForm, initialDiplomeForm, initialContactForm } from './constants';
import type { StudentFormData, DiplomeFormData, ContactFormData } from './types';
import type { StudentDiplome } from '../../../api/studentDiplome';
import type { StudentContact } from '../../../api/studentContact';
import type { StudentLinkType } from '../../../api/studentLinkType';

export const useStudentModalData = (studentId: number) => {
  const [studentForm, setStudentForm] = useState<StudentFormData>(initialStudentForm);
  const [studentErrors, setStudentErrors] = useState<Record<string, string>>({});
  const [pictureFile, setPictureFile] = useState<File | null>(null);

  const [diplomeForm, setDiplomeForm] = useState<DiplomeFormData>(initialDiplomeForm);
  const [diplomeErrors, setDiplomeErrors] = useState<Record<string, string>>({});
  const [diplomeFile1, setDiplomeFile1] = useState<File | null>(null);
  const [diplomeFile2, setDiplomeFile2] = useState<File | null>(null);
  const [currentDiplome, setCurrentDiplome] = useState<StudentDiplome | null>(null);

  const [contactForm, setContactForm] = useState<ContactFormData>(initialContactForm);
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [currentContact, setCurrentContact] = useState<StudentContact | null>(null);

  const [linkTypeTitle, setLinkTypeTitle] = useState('');
  const [linkTypeStatus, setLinkTypeStatus] = useState<number>(1);
  const [linkTypeError, setLinkTypeError] = useState('');
  const [currentLinkType, setCurrentLinkType] = useState<StudentLinkType | null>(null);

  const { data: classRooms } = useClassRooms({ page: 1, limit: 100 });
  const { data: studentDetailsData, refetch: refetchStudentDetails } = useStudentDetails(studentId || 0);
  const { data: linkTypesData } = useStudentLinkTypes({ page: 1, limit: 100 });


  // Load existing data when editing using the new unified endpoint
  useEffect(() => {
    if (studentId && studentDetailsData) {
      const { student: studentData, diploma, contact, linkType } = studentDetailsData;

      // Load student data
      if (studentData) {
        // Directly access the fields - API returns camelCase (email2, phone2, codePostal)
        setStudentForm({
          gender: studentData.gender || '',
          first_name: studentData.first_name || '',
          last_name: studentData.last_name || '',
          birthday: studentData.birthday || '',
          email: studentData.email || '',
          email2: studentData.email2 || '',
          phone: studentData.phone || '',
          phone2: studentData.phone2 || '',
          address: studentData.address || '',
          codePostal: studentData.codePostal || '',
          city: studentData.city || '',
          country: studentData.country || '',
          nationality: studentData.nationality || '',
          picture: studentData.picture || '',
          status: typeof studentData.status === 'number' ? studentData.status : 1,
        });
      }

      // Load diplome data (singular object, can be null)
      if (diploma) {
        setCurrentDiplome(diploma);
        setDiplomeForm({
          title: diploma.title || '',
          school: diploma.school || '',
          diplome: diploma.diplome || '',
          annee: diploma.annee ? String(diploma.annee) : '',
          country: diploma.country || '',
          city: diploma.city || '',
          status: diploma.status || 1,
        });
      } else {
        setCurrentDiplome(null);
        setDiplomeForm(initialDiplomeForm);
      }

      // Load contact data (singular object, can be null)
      if (contact) {
        setCurrentContact(contact);
        setContactForm({
          firstname: contact.firstname || '',
          lastname: contact.lastname || '',
          birthday: contact.birthday || '',
          email: contact.email || '',
          phone: contact.phone || '',
          adress: contact.adress || '',
          codePostal: contact.codePostal || '',
          city: contact.city || '',
          country: contact.country || '',
          studentlinktypeId: contact.studentlinktypeId ?? '',
          status: contact.status || 1,
        });
      } else {
        setCurrentContact(null);
        setContactForm(initialContactForm);
      }

      // Load link type data (singular object, can be null)
      if (linkType) {
        setCurrentLinkType(linkType);
        setLinkTypeTitle(linkType.title || '');
        setLinkTypeStatus(linkType.status || 1);
      } else if (contact?.studentLinkType) {
        // Fallback to link type from contact if available
        setCurrentLinkType(contact.studentLinkType);
        setLinkTypeTitle(contact.studentLinkType.title || '');
        setLinkTypeStatus(contact.studentLinkType.status || 1);
      } else {
        setCurrentLinkType(null);
        setLinkTypeTitle('');
        setLinkTypeStatus(1);
      }
    } else if (!studentId) {
      // Reset form when studentId is cleared (modal closed or new student)
      setStudentForm(initialStudentForm);
    }
  }, [studentId, studentDetailsData]);

  return {
    // Student form
    studentForm,
    setStudentForm,
    studentErrors,
    setStudentErrors,
    pictureFile,
    setPictureFile,

    // Diplome form
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

    // Contact form
    contactForm,
    setContactForm,
    contactErrors,
    setContactErrors,
    currentContact,
    setCurrentContact,

    // Link type form
    linkTypeTitle,
    setLinkTypeTitle,
    linkTypeStatus,
    setLinkTypeStatus,
    linkTypeError,
    setLinkTypeError,
    currentLinkType,
    setCurrentLinkType,

    // Data
    classRooms,
    studentDetailsData,
    refetchStudentDetails,
    linkTypesData,

    // Expose setters for handlers
    setCurrentDiplomeFn: setCurrentDiplome,
    setCurrentContactFn: setCurrentContact,
    setCurrentLinkTypeFn: setCurrentLinkType,
  };
};

