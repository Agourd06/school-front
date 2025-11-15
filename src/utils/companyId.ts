import { DEFAULT_COMPANY_ID } from '../constants/status';

/**
 * Gets the company ID from localStorage (stored user data).
 * Falls back to DEFAULT_COMPANY_ID if not available.
 * This can be used in both React components and API files.
 */
export const getCompanyId = (): number => {
  try {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user?.company_id) {
        return user.company_id;
      }
    }
  } catch (error) {
    console.error('Error reading company ID from localStorage:', error);
  }
  return DEFAULT_COMPANY_ID;
};

