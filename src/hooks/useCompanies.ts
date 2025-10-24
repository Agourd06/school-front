import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { companyApi } from '../api/company';
import type { UpdateCompanyRequest } from '../api/company';

export const useCompanies = () => {
  return useQuery({
    queryKey: ['companies'],
    queryFn: companyApi.getAll,
  });
};

export const useCompany = (id: number) => {
  return useQuery({
    queryKey: ['companies', id],
    queryFn: () => companyApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: companyApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useUpdateCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateCompanyRequest & { id: number }) => 
      companyApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};

export const useDeleteCompany = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: companyApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
    },
  });
};
