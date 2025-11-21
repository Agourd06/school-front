import { getCompanyId } from './companyId';

/**
 * Utility functions for company-scoped API operations.
 * 
 * When the backend extracts company_id from JWT token and automatically filters by it,
 * use these utilities to ensure company_id is properly set in create/update operations.
 */

/**
 * Ensures company_id is set in a payload object.
 * Used for create/update operations where company_id should come from authenticated user.
 * 
 * @param payload - The payload object (can be FormData or regular object)
 * @returns The payload with company_id set (mutates FormData, returns new object for regular objects)
 */
export const ensureCompanyId = <T extends Record<string, unknown> | FormData>(payload: T): T => {
  const companyId = getCompanyId();
  
  if (payload instanceof FormData) {
    // For FormData, set company_id if not already present
    if (!payload.has('company_id')) {
      payload.append('company_id', String(companyId));
    }
    return payload;
  } else {
    // For regular objects, ensure company_id is set
    return {
      ...payload,
      company_id: companyId,
    } as T;
  }
};

/**
 * Removes company_id from query parameters.
 * The backend extracts company_id from JWT token, so we don't need to send it in query params.
 * 
 * @param params - Query parameters object
 * @returns New params object without company_id
 */
export const removeCompanyIdFromParams = <T extends Record<string, unknown>>(params: T): Omit<T, 'company_id'> => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { company_id, ...rest } = params;
  return rest;
};

