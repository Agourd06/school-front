import type { Student } from '../api/students';
import type { ClassEntity } from '../api/classes';

export interface StudentDataForPlaceholders {
  student: Student;
  class?: ClassEntity | null;
}

/**
 * Replaces placeholders in attestation description with actual student data
 * 
 * Placeholders:
 * - &nom# -> first_name
 * - &surname# -> last_name
 * - &fullname# -> first_name + last_name
 * - &datebirth# -> birthday (formatted as YYYY/MM/DD)
 * - &classe# -> class title
 * - &specialization# -> specialization title
 * - &niveau# -> level title
 * - &graduationyear# -> school year title
 */
export const replaceAttestationPlaceholders = (
  description: string,
  data: StudentDataForPlaceholders
): string => {
  if (!description) return '';

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

  // Replace placeholders (case-insensitive)
  let result = description;
  
  // Replace &nom# with first name
  result = result.replace(/&nom#/gi, firstName);
  
  // Replace &surname# with last name
  result = result.replace(/&surname#/gi, lastName);
  
  // Replace &fullname# with full name
  result = result.replace(/&fullname#/gi, fullName);
  
  // Replace &datebirth# with date of birth
  result = result.replace(/&datebirth#/gi, dateBirth);
  
  // Replace &classe# with class name
  result = result.replace(/&classe#/gi, className);
  
  // Replace &specialization# or &specialusation# (typo support) with specialization
  result = result.replace(/&special(?:ization|usation)#/gi, specialization);
  
  // Replace &niveau# with level
  result = result.replace(/&niveau#/gi, level);
  
  // Replace &graduationyear# with graduation year (school year)
  result = result.replace(/&graduationyear#/gi, graduationYear);

  return result;
};

