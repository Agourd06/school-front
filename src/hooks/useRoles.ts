import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { rolesApi, type CreateRoleRequest, type UpdateRoleRequest, type GetRolesParams } from '../api/roles';

/**
 * Hook to get all roles with pagination
 */
export const useRoles = (params: GetRolesParams = {}) => {
  return useQuery({
    queryKey: ['roles', params],
    queryFn: () => rolesApi.getAll(params),
  });
};

/**
 * Hook to get a single role by ID
 */
export const useRole = (id: number | null) => {
  return useQuery({
    queryKey: ['roles', id],
    queryFn: () => (id ? rolesApi.getById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
};

/**
 * Hook to create a new role
 */
export const useCreateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateRoleRequest) => rolesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

/**
 * Hook to update a role
 */
export const useUpdateRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateRoleRequest }) => rolesApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
      queryClient.invalidateQueries({ queryKey: ['roles', variables.id] });
    },
  });
};

/**
 * Hook to delete a role
 */
export const useDeleteRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: number) => rolesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['roles'] });
    },
  });
};

/**
 * Hook to get pages assigned to a role
 */
export const useRolePages = (roleId: number | null) => {
  return useQuery({
    queryKey: ['roles', roleId, 'pages'],
    queryFn: () => (roleId ? rolesApi.getPages(roleId) : Promise.resolve([])),
    enabled: !!roleId,
  });
};

/**
 * Hook to assign a page to a role
 */
export const useAssignPageToRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, pageId }: { roleId: number; pageId: number }) => 
      rolesApi.assignPage(roleId, pageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId, 'pages'] });
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });
};

/**
 * Hook to remove a page from a role
 */
export const useRemovePageFromRole = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ roleId, pageId }: { roleId: number; pageId: number }) => 
      rolesApi.removePage(roleId, pageId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['roles', variables.roleId, 'pages'] });
      queryClient.invalidateQueries({ queryKey: ['pages'] });
    },
  });
};
