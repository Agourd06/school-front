import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useStudentDetails } from '../../../hooks/useStudents';
import { useClassRooms } from '../../../hooks/useClassRooms';
import { useStudentLinkTypes } from '../../../hooks/useStudentLinkTypes';
import { initialStudentForm, initialDiplomeForm, initialContactForm } from './constants';
import type { StudentFormData, DiplomeFormData, ContactFormData } from './types';
import type { StudentDiplome } from '../../../api/studentDiplome';
import type { StudentContact } from '../../../api/studentContact';
import type { StudentLinkType } from '../../../api/studentLinkType';
import type { ClassRoom } from '../../../api/classRoom';
import type { Student } from '../../../api/students';
import type { PaginatedResponse } from '../../../types/api';

interface StudentModalContextValue {
  // Student ID - the core value that flows through all steps
  studentId: number | null;
  setStudentId: (id: number | null) => void;

  // Student form data
  studentForm: StudentFormData;
  setStudentForm: (form: StudentFormData) => void;
  studentErrors: Record<string, string>;
  setStudentErrors: (errors: Record<string, string>) => void;
  pictureFile: File | null;
  setPictureFile: (file: File | null) => void;

  // Diplome form data
  diplomeForm: DiplomeFormData;
  setDiplomeForm: (form: DiplomeFormData) => void;
  diplomeErrors: Record<string, string>;
  setDiplomeErrors: (errors: Record<string, string>) => void;
  diplomeFile1: File | null;
  setDiplomeFile1: (file: File | null) => void;
  diplomeFile2: File | null;
  setDiplomeFile2: (file: File | null) => void;
  currentDiplome: StudentDiplome | null;
  setCurrentDiplome: (diplome: StudentDiplome | null) => void;

  // Contact form data
  contactForm: ContactFormData;
  setContactForm: (form: ContactFormData) => void;
  contactErrors: Record<string, string>;
  setContactErrors: (errors: Record<string, string>) => void;
  currentContact: StudentContact | null;
  setCurrentContact: (contact: StudentContact | null) => void;

  // Link type form data
  linkTypeTitle: string;
  setLinkTypeTitle: (title: string) => void;
  linkTypeStatus: number;
  setLinkTypeStatus: (status: number) => void;
  linkTypeError: string;
  setLinkTypeError: (error: string) => void;
  currentLinkType: StudentLinkType | null;
  setCurrentLinkType: (linkType: StudentLinkType | null) => void;

  // External data
  classRooms: PaginatedResponse<ClassRoom> | null | undefined;
  studentDetailsData: {
    student: Student;
    diploma: StudentDiplome | null;
    contact: StudentContact | null;
    linkType: StudentLinkType | null;
  } | null | undefined;
  refetchStudentDetails: () => void;
  linkTypesData: { data: StudentLinkType[]; meta: { page?: number; limit?: number; total?: number; totalPages?: number; hasNext?: boolean; hasPrevious?: boolean } } | null | undefined;

  // Computed values
  studentName: string;
  isEditMode: boolean;
}

const StudentModalContext = createContext<StudentModalContextValue | undefined>(undefined);

interface StudentModalProviderProps {
  initialStudentId?: number | null;
  children: ReactNode;
}

export const StudentModalProvider: React.FC<StudentModalProviderProps> = ({
  initialStudentId = null,
  children,
}) => {
  const [studentId, setStudentId] = useState<number | null>(initialStudentId);
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
  const { data: studentDetailsData, refetch: refetchStudentDetailsRaw } = useStudentDetails(studentId || 0);
  const { data: linkTypesData } = useStudentLinkTypes({ page: 1, limit: 100 });

  const refetchStudentDetails = () => {
    void refetchStudentDetailsRaw();
  };

  // Update studentId when initialStudentId changes
  useEffect(() => {
    if (initialStudentId !== null && initialStudentId !== studentId) {
      setStudentId(initialStudentId);
    }
  }, [initialStudentId, studentId]);

  // Load existing data when editing (studentId exists and data is available)
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

      // Load diplome data
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

      // Load contact data
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

      // Load link type data
      if (linkType) {
        setCurrentLinkType(linkType);
        setLinkTypeTitle(linkType.title || '');
        setLinkTypeStatus(linkType.status || 1);
      } else if (contact?.studentLinkType) {
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

  // Compute student name
  const studentName = studentDetailsData?.student
    ? `${studentDetailsData.student.first_name ?? ''} ${studentDetailsData.student.last_name ?? ''}`.trim() ||
      studentDetailsData.student.email ||
      '—'
    : '—';

  const isEditMode = Boolean(studentId);

  const value: StudentModalContextValue = {
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
    setLinkTypeTitle,
    linkTypeStatus,
    setLinkTypeStatus,
    linkTypeError,
    setLinkTypeError,
    currentLinkType,
    setCurrentLinkType,
    classRooms,
    studentDetailsData,
    refetchStudentDetails,
    linkTypesData,
    studentName,
    isEditMode,
  };

  return <StudentModalContext.Provider value={value}>{children}</StudentModalContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useStudentModalContext = () => {
  const context = useContext(StudentModalContext);
  if (!context) {
    throw new Error('useStudentModalContext must be used within StudentModalProvider');
  }
  return context;
};

