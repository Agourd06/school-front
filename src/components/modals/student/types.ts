export type StepKey = 'student' | 'diplome' | 'contact' | 'linkType';

export interface Step {
  key: StepKey;
  label: string;
  description: string;
}

export interface StudentFormData {
  gender: string;
  first_name: string;
  last_name: string;
  birthday: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  nationality: string;
  picture: string;
  status: number;
  class_room_id: number | '';
}

export interface DiplomeFormData {
  title: string;
  school: string;
  diplome: string;
  annee: string;
  country: string;
  city: string;
  status: number;
}

export interface ContactFormData {
  firstname: string;
  lastname: string;
  birthday: string;
  email: string;
  phone: string;
  adress: string;
  city: string;
  country: string;
  studentlinktypeId: number | string | '';
  status: number;
}

export interface LinkTypeFormData {
  title: string;
  status: number;
}

