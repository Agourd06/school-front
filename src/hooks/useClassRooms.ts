import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { classRoomApi } from '../api/classRoom';
import type { CreateClassRoomRequest, UpdateClassRoomRequest, GetAllClassRoomsParams } from '../api/classRoom';

export const useClassRooms = (params: GetAllClassRoomsParams = {}) => {
  return useQuery({
    queryKey: ['classRooms', params],
    queryFn: () => classRoomApi.getAll(params),
    placeholderData: keepPreviousData,
  });
};

export const useClassRoom = (id: number) => {
  return useQuery({
    queryKey: ['classRooms', id],
    queryFn: () => classRoomApi.getById(id),
    enabled: !!id,
  });
};

export const useCreateClassRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassRoomRequest) => classRoomApi.create(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classRooms'] }),
  });
};

export const useUpdateClassRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: UpdateClassRoomRequest & { id: number }) => classRoomApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classRooms'] }),
  });
};

export const useDeleteClassRoom = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => classRoomApi.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classRooms'] }),
  });
};

export default useClassRooms;


