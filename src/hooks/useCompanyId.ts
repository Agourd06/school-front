import { useAuth } from '../context/AuthContext';
import { DEFAULT_COMPANY_ID } from '../constants/status';

/**
 * Hook to get the current user's company ID.
 * Falls back to DEFAULT_COMPANY_ID if user is not logged in or has no company.
 */
export const useCompanyId = (): number => {
  const { companyId } = useAuth();
  return companyId ?? DEFAULT_COMPANY_ID;
};

