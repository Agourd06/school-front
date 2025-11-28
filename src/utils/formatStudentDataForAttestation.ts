import type { Student } from '../api/students';

export interface SimplifiedClass {
  id: number;
  title: string;
  specialization: { id: number; title: string } | null;
  level: { id: number; title: string } | null;
  schoolYear: { id: number; title: string } | null;
}

export interface StudentDataForAttestation {
  student: Student;
  class?: SimplifiedClass | null;
}

/**
 * Formats student data as plain text lines to append to attestation description
 * 
 * Format:
 * firstName# joe
 * lastname# test
 * fullname# joe test
 * datebirth# 2000/06/11
 * classe# className
 * specialization# specialization
 * level # level1
 * YearGraduation# (class year)
 */
export const formatStudentDataForAttestation = (
  data: StudentDataForAttestation
): string => {
  const { student, class: classEntity } = data;

  // Format date of birth
  const formatDate = (dateString?: string): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}/${month}/${day}`;
    } catch {
      return dateString;
    }
  };

  // Get values
  const firstName = student.first_name || '';
  const lastName = student.last_name || '';
  const fullName = `${firstName} ${lastName}`.trim() || student.email || '';
  const dateBirth = formatDate(student.birthday);
  const className = classEntity?.title || '';
  const specialization = classEntity?.specialization?.title || '';
  const level = classEntity?.level?.title || '';
  const graduationYear = classEntity?.schoolYear?.title || '';

  // Format as HTML paragraphs (to match RichTextEditor format)
  const lines = [
    `firstName# ${firstName}`,
    `lastname# ${lastName}`,
    `fullname# ${fullName}`,
    `datebirth# ${dateBirth}`,
    `classe# ${className}`,
    `specialization# ${specialization}`,
    `level # ${level}`,
    `YearGraduation# ${graduationYear}`,
  ];

  // Convert to HTML paragraphs
  return lines.map(line => `<p>${line}</p>`).join('\n');
};

