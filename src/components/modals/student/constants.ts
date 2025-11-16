import type { Step } from './types';

export const STEPS: Step[] = [
  { key: 'student', label: 'Student', description: 'Basic details' },
  { key: 'diplome', label: 'Diplome', description: 'Academic record' },
  { key: 'contact', label: 'Contact', description: 'Guardian / emergency contact' },
  { key: 'linkType', label: 'Link Type', description: 'Relationship type' },
];

export const initialStudentForm = {
  gender: '',
  first_name: '',
  last_name: '',
  birthday: '',
  email: '',
  phone: '',
  address: '',
  city: '',
  country: '',
  nationality: '',
  picture: '',
  status: 1 as number,
  class_room_id: '' as number | '',
};

export const initialDiplomeForm = {
  title: '',
  school: '',
  diplome: '',
  annee: '' as string,
  country: '',
  city: '',
  status: 1 as number,
};

export const initialContactForm = {
  firstname: '',
  lastname: '',
  birthday: '',
  email: '',
  phone: '',
  adress: '',
  city: '',
  country: '',
  studentlinktypeId: '' as number | string | '',
  status: 1 as number,
};

