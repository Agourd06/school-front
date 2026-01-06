/**
 * User profile types matching backend enum values
 * Migrated from 'role' to 'profile' with new enum values
 * Default profile is 'admin' (administrateur) - has access to everything
 */
export type Profile = 'support' | 'admin' | 'finance' | 'student' | 'direction' | 'prof' | 'teacher' | 'scholarity';

export const PROFILE_DEFAULT: Profile = 'admin';

export const PROFILE_OPTIONS: { value: Profile; label: string }[] = [
  { value: 'admin', label: 'Administrateur' },
  { value: 'support', label: 'Support' },
  { value: 'finance', label: 'Finance' },
  { value: 'student', label: 'Student' },
  { value: 'direction', label: 'Direction' },
  { value: 'prof', label: 'Professor' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'scholarity', label: 'Scholarity' },
];

/**
 * Get the display label for a profile value
 */
export const getProfileLabel = (profile: Profile): string => {
  return PROFILE_OPTIONS.find(opt => opt.value === profile)?.label || profile;
};

/**
 * Check if a profile has dashboard access
 * 'admin' (administrateur) has access to everything including dashboard
 * 'support' also has dashboard access
 */
export const hasDashboardAccess = (profile: Profile): boolean => {
  return profile === 'admin' || profile === 'support';
};

