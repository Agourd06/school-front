import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userRolesApi } from '../api/userRoles';

/**
 * Hook to get roles assigned to a user
 */
export const useUserRoles = (userId: number | null) => {
  return useQuery({
    queryKey: ['users', userId, 'roles'],
    queryFn: () => (userId ? userRolesApi.getUserRoles(userId) : Promise.resolve([])),
    enabled: !!userId,
  });
};

/**
 * Hook to assign a role to a user
 */
export const useAssignRoleToUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) => 
      userRolesApi.assignRole(userId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId, 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

/**
 * Hook to remove a role from a user
 */
export const useRemoveRoleFromUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ userId, roleId }: { userId: number; roleId: number }) => 
      userRolesApi.removeRole(userId, roleId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['users', variables.userId, 'roles'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};
