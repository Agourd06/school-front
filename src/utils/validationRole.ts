import type { Profile } from '../types/profile';

/**
 * Teacher: can edit and perform first validation (DRAFT → TEACHER_VALIDATED).
 * Controller (direction/admin): can view teacher-validated data and perform final validation (TEACHER_VALIDATED → LOCKED).
 * Uses both profile (single value from backend) and roles (array) so buttons show whether backend sends profile or roles.
 */
export function isTeacher(profile: Profile | undefined | null, roles?: string[] | null): boolean {
  if (profile === 'teacher') return true;
  const normalized = (roles ?? []).map((r) => String(r).toLowerCase().trim());
  return normalized.includes('teacher');
}

export function isController(profile: Profile | undefined | null, roles?: string[] | null): boolean {
  if (profile === 'direction' || profile === 'admin') return true;
  const normalized = (roles ?? []).map((r) => String(r).toLowerCase().trim());
  return normalized.includes('direction') || normalized.includes('admin');
}
