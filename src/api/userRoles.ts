import api from './axios';
import type { Role } from './roles';

/**
 * API for managing user-role assignments (Admin only)
 */
export const userRolesApi = {
  /**
   * Get roles assigned to a user
   */
  getUserRoles: async (userId: number): Promise<Role[]> => {
    const response = await api.get(`/users/${userId}/roles`);
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Assign a role to a user
   */
  assignRole: async (userId: number, roleId: number): Promise<{ user_id: number; role_id: number; company_id: number }> => {
    const response = await api.post(`/users/${userId}/roles`, { role_id: roleId });
    return response.data;
  },

  /**
   * Remove a role from a user
   */
  removeRole: async (userId: number, roleId: number): Promise<void> => {
    await api.delete(`/users/${userId}/roles/${roleId}`);
  },
};
