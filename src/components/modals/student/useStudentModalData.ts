import { useState, useEffect } from 'react';
import { useStudentDetails } from '../../../hooks/useStudents';
import { useClassRooms } from '../../../hooks/useClassRooms';
import { useStudentLinkTypes } from '../../../hooks/useStudentLinkTypes';
import { initialStudentForm, initialDiplomeForm, initialContactForm } from './constants';
import type { StudentFormData, DiplomeFormData, ContactFormData } from './types';

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

  // Log which student ID we're fetching
  useEffect(() => {
    if (studentId) {
      console.log('🎯 StudentModal: Fetching details for student ID:', studentId);
    }
  }, [studentId]);

  // Log student details for debugging
  useEffect(() => {
    if (studentDetailsData) {
      console.log('=== Student Details Debug ===');
      console.log('Full Student Details Data:', JSON.stringify(studentDetailsData, null, 2));
      console.log('Student Details Data Type:', typeof studentDetailsData);
      console.log('Student Details Data Keys:', Object.keys(studentDetailsData));
      console.log('Student:', studentDetailsData.student);
      console.log('Diploma:', studentDetailsData.diploma);
      console.log('Contact:', studentDetailsData.contact);
      console.log('Contact Type:', typeof studentDetailsData.contact);
      console.log('Contact is null?', studentDetailsData.contact === null);
      console.log('Contact is undefined?', studentDetailsData.contact === undefined);
      console.log('Link Type:', studentDetailsData.linkType);
      console.log('Link Type Type:', typeof studentDetailsData.linkType);
      console.log('Link Type is null?', studentDetailsData.linkType === null);
      console.log('Link Type is undefined?', studentDetailsData.linkType === undefined);
      console.log('===========================');
    } else {
      console.log('Student Details Data is null/undefined:', studentDetailsData);
    }
  }, [studentDetailsData]);

  // Load existing data when editing using the new unified endpoint
  useEffect(() => {
    if (studentId && studentDetailsData) {
      const { student: studentData, diploma, contact, linkType } = studentDetailsData;

      // Load student data
      if (studentData) {
        setStudentForm({
          gender: studentData.gender || '',
          first_name: studentData.first_name || '',
          last_name: studentData.last_name || '',
          birthday: studentData.birthday || '',
          email: studentData.email || '',
          phone: studentData.phone || '',
          address: studentData.address || '',
          city: studentData.city || '',
          country: studentData.country || '',
          nationality: studentData.nationality || '',
          picture: studentData.picture || '',
          status: typeof studentData.status === 'number' ? studentData.status : 1,
          class_room_id: studentData.class_room_id ?? '',
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

