import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { companyApi } from '../api/company';
import type { UpdateCompanyRequest, GetCompaniesParams } from '../api/company';

export const useCompanies = (params: GetCompaniesParams = {}) => {
  return useQuery({
    queryKey: ['companies', params],
    queryFn: () => companyApi.getAll(params),
    placeholderData: keepPreviousData,
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
