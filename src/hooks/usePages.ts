import { useQuery } from '@tanstack/react-query';
import { pagesApi, type GetPagesParams } from '../api/pages';

/**
 * Hook to get all pages with pagination
 */
export const usePages = (params: GetPagesParams = {}) => {
  return useQuery({
    queryKey: ['pages', params],
    queryFn: () => pagesApi.getAll(params),
  });
};

/**
 * Hook to get a single page by ID
 */
export const usePage = (id: number | null) => {
  return useQuery({
    queryKey: ['pages', id],
    queryFn: () => (id ? pagesApi.getById(id) : Promise.resolve(null)),
    enabled: !!id,
  });
};

/**
 * Hook to get current user's allowed routes
 */
export const useMyRoutes = () => {
  return useQuery({
    queryKey: ['pages', 'my-routes'],
    queryFn: () => pagesApi.getMyRoutes(),
  });
};
